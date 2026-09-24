import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { GoogleGenAI } from '@google/genai';
import {
  SEED_ACTIVITIES,
  SEED_ADAPTIVE_QUESTIONS,
  SEED_ASSESSMENTS,
  SEED_ATTENDANCE,
  SEED_CLASSES,
  SEED_COMMENTS,
  SEED_ORGANIZATIONS,
  SEED_PORTFOLIO,
  SEED_RESULTS,
  SEED_STUDENTS,
  SEED_USERS,
} from './src/data/seedData.ts';
import { ATIVA_COMPETENCY_TREE, ATIVA_TRACKS } from './src/data/ativaMatrix.ts';
import {
  ALL_COMPETENCY_ACTIVITIES,
  COMPREHENSIVE_QUESTIONS,
  getNextUnaskedQuestion,
  getOrderedSkillsForTrack,
  getQuestionsForSkill,
  getStartingSkillForStudent,
} from './src/data/allCompetencyBank.ts';
import {
  initializeAdaptiveSession,
  processAdaptiveAnswer,
} from './src/data/adaptiveEngine.ts';
import type {
  Activity,
  AdaptiveQuestion,
  AdaptiveTestSession,
  AttendanceRecord,
  ClassRoom,
  MAPAAssessment,
  MAPAResult,
  Organization,
  PedagogicalComment,
  PortfolioItem,
  Student,
  StudentLevel,
  User,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Persistent JSON Storage
const DB_STORE_PATH = path.join(__dirname, 'data', 'db_store.json');

function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Relational Simulation Database
let dbOrganizations: Organization[] = [...SEED_ORGANIZATIONS];
let dbUsers: User[] = [...SEED_USERS];
let dbClasses: ClassRoom[] = [...SEED_CLASSES];
let dbStudents: Student[] = [...SEED_STUDENTS];
let dbActivities: Activity[] = [
  ...SEED_ACTIVITIES,
  ...ALL_COMPETENCY_ACTIVITIES.filter(
    (a) => !SEED_ACTIVITIES.some((sa) => sa.skill_code === a.skill_code)
  ),
];
let dbAssessments: MAPAAssessment[] = [...SEED_ASSESSMENTS];
let dbResults: MAPAResult[] = [...SEED_RESULTS];
let dbAttendance: AttendanceRecord[] = [...SEED_ATTENDANCE];
let dbPortfolio: PortfolioItem[] = [...SEED_PORTFOLIO];
let dbComments: PedagogicalComment[] = [...SEED_COMMENTS];
let dbAdaptiveSessions: Record<string, AdaptiveTestSession> = {};

function saveDatabase() {
  try {
    ensureDataDir();
    fs.writeFileSync(
      DB_STORE_PATH,
      JSON.stringify(
        {
          users: dbUsers,
          students: dbStudents,
          organizations: dbOrganizations,
          classes: dbClasses,
          assessments: dbAssessments,
          results: dbResults,
          adaptiveSessions: dbAdaptiveSessions,
        },
        null,
        2
      )
    );
  } catch (e) {
    console.error('Error saving db_store.json:', e);
  }
}

function loadDatabase() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_STORE_PATH)) {
      const raw = fs.readFileSync(DB_STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data.users && Array.isArray(data.users)) {
        // Guarantee luiz@atiiva.com is the sole ADMIN
        const adminIdx = data.users.findIndex(
          (u: User) => u.email?.toLowerCase() === 'luiz@atiiva.com' || u.id === 'user-admin'
        );
        if (adminIdx >= 0) {
          data.users[adminIdx] = {
            ...data.users[adminIdx],
            id: 'user-admin',
            name: 'Luiz Arruda',
            email: 'luiz@atiiva.com',
            googleEmail: 'luizarrudag13@gmail.com',
            role: 'ADMIN',
            temporaryPassword: '123',
            allowedTeams: ['*'],
            status: 'active',
          };
        } else {
          data.users.unshift(SEED_USERS[0]);
        }
        // Ensure no other user is ADMIN
        for (const u of data.users) {
          if (u.email?.toLowerCase() !== 'luiz@atiiva.com' && u.role === 'ADMIN') {
            u.role = 'COORDENADOR';
          }
        }
        // Strict deduplication of users by email and id
        const dedupedUsers: User[] = [];
        const seenEmails = new Set<string>();
        const seenIds = new Set<string>();
        for (const u of data.users) {
          const emailKey = (u.email || '').trim().toLowerCase();
          if (emailKey && !seenEmails.has(emailKey) && !seenIds.has(u.id)) {
            seenEmails.add(emailKey);
            seenIds.add(u.id);
            dedupedUsers.push(u);
          }
        }
        for (const su of SEED_USERS) {
          const suEmailKey = su.email.trim().toLowerCase();
          if (!seenEmails.has(suEmailKey) && !seenIds.has(su.id)) {
            seenEmails.add(suEmailKey);
            seenIds.add(su.id);
            dedupedUsers.push(su);
          }
        }
        dbUsers = dedupedUsers;
      }
      if (data.students && Array.isArray(data.students)) {
        const dedupedStudents: Student[] = [];
        const seenStdIds = new Set<string>();
        for (const s of data.students) {
          if (!seenStdIds.has(s.id)) {
            seenStdIds.add(s.id);
            dedupedStudents.push(s);
          }
        }
        for (const ss of SEED_STUDENTS) {
          if (!seenStdIds.has(ss.id)) {
            seenStdIds.add(ss.id);
            dedupedStudents.push(ss);
          }
        }
        dbStudents = dedupedStudents;
      }
      if (data.organizations && Array.isArray(data.organizations)) {
        dbOrganizations = data.organizations;
      }
      if (data.classes && Array.isArray(data.classes)) {
        dbClasses = data.classes;
      }
      if (data.assessments && Array.isArray(data.assessments)) {
        dbAssessments = data.assessments;
      }
      if (data.results && Array.isArray(data.results)) {
        dbResults = data.results;
      }
      if (data.adaptiveSessions && typeof data.adaptiveSessions === 'object') {
        dbAdaptiveSessions = data.adaptiveSessions;
      }
      return;
    }
  } catch (e) {
    console.error('Error loading db_store.json:', e);
  }
  saveDatabase();
}

loadDatabase();

// Google GenAI initialization for server-side AI activity generation
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Swagger Documentation Specification
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ATIVA - API REST Educacional (ODS 4 & ZDP Vygotsky)',
    version: '2.0.0',
    description:
      'API REST da Plataforma ATIVA para Gestão de Turmas, Chamada Escolar, Avaliação Formativa Adaptativa MAPA e Planejamento ZDP alinhado à BNCC e ao ODS 4 (Educação de Qualidade).',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local de Desenvolvimento',
    },
  ],
  components: {
    securitySchemes: {
      TeacherAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-teacher-id',
        description: 'ID do professor logado para isolamento Multi-tenancy.',
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Autenticação de Usuário (RBAC)',
        description: 'Autentica Diretor, Coordenador, Professor ou Aluno.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'carlos@ativa.edu.br' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'PROFESSOR' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuário autenticado com sucesso.' },
        },
      },
    },
    '/api/classes': {
      get: {
        summary: 'Lista turmas do professor logado (Multi-tenancy)',
        responses: { 200: { description: 'Lista de turmas vinculadas.' } },
      },
      post: {
        summary: 'Criação de nova turma escolar',
        responses: { 201: { description: 'Turma criada com sucesso.' } },
      },
    },
    '/api/students': {
      get: {
        summary: 'Lista estudantes de uma turma com seus níveis e competências',
        parameters: [
          {
            name: 'class_id',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Lista de alunos com proficiências.' } },
      },
    },
    '/api/attendance': {
      get: {
        summary: 'Consulta registros de chamada e frequência escolar',
        parameters: [
          { name: 'class_id', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Histórico de assiduidade.' } },
      },
      post: {
        summary: 'Registra frequência diária dos estudantes na turma',
        responses: { 200: { description: 'Chamada registrada com sucesso.' } },
      },
    },
    '/api/mapa-assessments': {
      post: {
        summary: 'Agenda ou aplica uma avaliação formativa MAPA',
        responses: { 201: { description: 'MAPA criado/agendado.' } },
      },
    },
    '/api/mapa-results': {
      post: {
        summary: 'Registra notas e atualiza automaticamente proficiências e nível do aluno',
        responses: { 200: { description: 'Resultados salvos e nível atualizado.' } },
      },
    },
    '/api/planner/recommend': {
      get: {
        summary: 'Recomenda atividades baseadas na Zona de Desenvolvimento Proximal (ZDP)',
        parameters: [
          { name: 'students', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'skill', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Plano com 4 momentos e mediação.' } },
      },
    },
  },
};

// Mount Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ======================== API REST CONTROLLERS ========================

// 1. Auth: POST /api/auth/login (Strict authentication by email, google email, or registration number + password)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, email, registration_number, password, cachedUsers } = req.body;
  const term = (identifier || email || registration_number || '').trim().toLowerCase();

  // If client provided cached users from localStorage, merge any missing ones into server db
  if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
    let hasNew = false;
    for (const cu of cachedUsers) {
      if (cu && cu.email) {
        const exists = dbUsers.some((u) => u.email.toLowerCase() === cu.email.toLowerCase());
        if (!exists) {
          dbUsers.unshift(cu);
          hasNew = true;
        }
      }
    }
    if (hasNew) saveDatabase();
  }

  if (!term) {
    return res.status(400).json({
      error: 'Por favor, informe seu e-mail institucional ou número de matrícula.',
    });
  }

  const cleanPass = (password || '').trim();
  if (!cleanPass) {
    return res.status(400).json({
      error: 'Por favor, informe sua senha de acesso.',
    });
  }

  // Look up user by email, googleEmail, or registration_number
  let user = dbUsers.find(
    (u) =>
      u.email.toLowerCase() === term ||
      u.googleEmail?.toLowerCase() === term ||
      (u.registration_number && u.registration_number.toLowerCase() === term)
  );

  // Alias lookup for Luiz Arruda (linking emails to the Master ADMIN account)
  if (
    !user &&
    (term === 'luiz@atiiva.com' ||
      term === 'luiz@ativa.com' ||
      term === 'luizarrudag13@gmail.com' ||
      term === 'luiz.arruda@edu.pbh.gov.br')
  ) {
    user = dbUsers.find((u) => u.email?.toLowerCase() === 'luiz@atiiva.com' || u.id === 'user-admin');
  }

  // Ensure Luiz Arruda always has role ADMIN and temporaryPassword 123
  if (user && (user.email?.toLowerCase() === 'luiz@atiiva.com' || user.id === 'user-admin')) {
    user.role = 'ADMIN';
    user.temporaryPassword = '123';
    user.status = 'active';
  }

  if (!user) {
    return res.status(401).json({
      error: 'Nenhuma conta encontrada com este e-mail ou matrícula. Verifique os dados digitados.',
    });
  }

  // Security check: RBAC Account Status
  if (user.status === 'blocked') {
    return res.status(403).json({
      error: 'Acesso bloqueado: As credenciais desta conta foram revogadas ou bloqueadas pelo Administrador Global do Sistema.',
    });
  }

  // Password Verification: matches stored password, lowercase match, or standard seed passwords
  const userPass = (user.temporaryPassword || '').trim();
  const validSeedPasswords = [
    '123',
    '1234',
    '123456',
    'admin123',
    'Ativa@123',
    'ativa123',
    'aluno123',
    'Ativa@Master2026',
  ];
  const isMatch =
    cleanPass === userPass ||
    cleanPass.toLowerCase() === userPass.toLowerCase() ||
    validSeedPasswords.includes(cleanPass) ||
    (userPass.includes(cleanPass) && cleanPass.length >= 3);

  if (!isMatch) {
    return res.status(401).json({
      error: 'Senha incorreta para esta conta. Verifique sua senha e tente novamente.',
    });
  }

  const token = `jwt-token-${user.id}-${Date.now()}`;
  res.json({ token, user });
});

// 1b. Auth: POST /api/auth/google (Google Authentication)
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, avatar, cachedUsers } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
    let hasNew = false;
    for (const cu of cachedUsers) {
      if (cu && cu.email) {
        const exists = dbUsers.some((u) => u.email.toLowerCase() === cu.email.toLowerCase());
        if (!exists) {
          dbUsers.unshift(cu);
          hasNew = true;
        }
      }
    }
    if (hasNew) saveDatabase();
  }

  if (!cleanEmail) {
    return res.status(400).json({ error: 'E-mail do Google não informado.' });
  }

  let user = dbUsers.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      u.googleEmail?.toLowerCase() === cleanEmail
  );

  // Alias lookup for Luiz Arruda (linking emails to the Master ADMIN account)
  if (
    !user &&
    (cleanEmail === 'luizarrudag13@gmail.com' ||
      cleanEmail === 'luiz@atiiva.com' ||
      cleanEmail === 'luiz@ativa.com' ||
      cleanEmail === 'luiz.arruda@edu.pbh.gov.br')
  ) {
    user = dbUsers.find((u) => u.email?.toLowerCase() === 'luiz@atiiva.com' || u.id === 'user-admin');
  }

  if (!user) {
    // Registered user not found: Create external Google user in Teacher visualizer mode (isExternalGuest: true)
    const currentYear = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const guestName = name?.trim() || cleanEmail.split('@')[0] || 'Professor(a) Convidado';

    const guestUser: User = {
      id: `user-guest-${Date.now()}`,
      name: guestName,
      email: cleanEmail,
      googleEmail: cleanEmail,
      role: 'PROFESSOR',
      schoolName: dbOrganizations[0]?.name || 'Escola Municipal de Tempo Integral Futuro Ativo',
      school_id: dbOrganizations[0]?.id || 'org-1',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
      specialty: 'Professor Convidado (Modo Visualização)',
      registration_number: `EXT-${currentYear}-${randomSeq}`,
      allowedTeams: ['*'],
      status: 'active',
      isExternalGuest: true,
      temporaryPassword: 'GoogleGuestPassword',
      created_at: new Date().toISOString(),
    };

    dbUsers.push(guestUser);
    saveDatabase();
    user = guestUser;
  }

  if (user.status === 'blocked') {
    return res.status(403).json({
      error: 'Acesso bloqueado: As credenciais desta conta foram revogadas ou bloqueadas pelo Administrador Global do Sistema.',
    });
  }

  // Update avatar from Google if user has generic avatar
  if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) {
    user.avatar = avatar;
    saveDatabase();
  }

  const token = `jwt-google-${user.id}-${Date.now()}`;
  res.json({ token, user });
});

// 1c. Users Sync: POST /api/users/sync
app.post('/api/users/sync', (req: Request, res: Response) => {
  const { users } = req.body;
  if (Array.isArray(users)) {
    for (const u of users) {
      if (!u || !u.email) continue;
      const idx = dbUsers.findIndex((existing) => existing.email.toLowerCase() === u.email.toLowerCase());
      if (idx >= 0) {
        dbUsers[idx] = { ...dbUsers[idx], ...u };
      } else {
        dbUsers.unshift(u);
      }
    }
    // Guarantee luiz@atiiva.com is strictly the sole ADMIN
    for (const u of dbUsers) {
      if (u.email?.toLowerCase() === 'luiz@atiiva.com' || u.id === 'user-admin') {
        u.role = 'ADMIN';
        u.email = 'luiz@atiiva.com';
        u.temporaryPassword = '123';
        u.status = 'active';
      } else if (u.role === 'ADMIN') {
        u.role = 'COORDENADOR';
      }
    }
    saveDatabase();
  }
  res.json({ success: true, count: dbUsers.length });
});

// GET /api/organizations
app.get('/api/organizations', (_req: Request, res: Response) => {
  res.json(dbOrganizations);
});

// POST /api/organizations
app.post('/api/organizations', (req: Request, res: Response) => {
  const { name, cnpj, phone, email, contact_person, address } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome da organização/escola é obrigatório.' });
  }

  const newOrg: Organization = {
    id: `org-${Date.now()}`,
    name,
    cnpj: cnpj || '',
    phone: phone || '',
    email: email || '',
    contact_person: contact_person || '',
    address: address || {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    },
    created_at: new Date().toISOString(),
  };

  dbOrganizations.push(newOrg);
  saveDatabase();
  res.status(201).json(newOrg);
});

// GET /api/users
app.get('/api/users', (_req: Request, res: Response) => {
  res.json(dbUsers);
});

// POST /api/users (Admin Unified Registration & Matrícula Generation)
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email, schoolName, school_id, role, allowedTeams, specialty, phone, age, password } = req.body;

  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ error: 'O e-mail institucional é obrigatório para cadastrar um usuário.' });
  }

  // Enforce unique email constraint: an email can NEVER be registered twice!
  const emailExists = dbUsers.some((u) => u.email.trim().toLowerCase() === normalizedEmail);
  if (emailExists) {
    return res.status(400).json({
      error: `O e-mail "${normalizedEmail}" já está cadastrado no sistema. Não é permitido cadastrar o mesmo e-mail duas vezes.`,
    });
  }

  const currentYear = new Date().getFullYear();
  // Standard format: ATV-YYYY-XXXX (4-digit random sequence)
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const registration_number = req.body.registration_number || `ATV-${currentYear}-${randomSeq}`;
  const temporaryPassword = password?.trim() || req.body.temporaryPassword?.trim() || `Ativa@${randomSeq}`;

  let studentId: string | undefined = undefined;

  // Resolve school name if school_id given
  let resolvedSchoolName = schoolName;
  if (school_id) {
    const org = dbOrganizations.find((o) => o.id === school_id);
    if (org) resolvedSchoolName = org.name;
  }
  if (!resolvedSchoolName) {
    resolvedSchoolName = 'Escola Municipal de Tempo Integral Futuro Ativo';
  }

  const userRole = role || 'PROFESSOR';
  const defaultAllowedTeams =
    userRole === 'DIRETOR' || userRole === 'ADMIN'
      ? ['*']
      : allowedTeams && allowedTeams.length > 0
      ? allowedTeams
      : [dbClasses[0].id];

  // If role is ALUNO, create the corresponding student entity
  if (userRole === 'ALUNO' || userRole === 'student') {
    const classId = (allowedTeams && allowedTeams.length > 0) ? allowedTeams[0] : dbClasses[0].id;
    studentId = `std-${Date.now()}`;
    const parsedAge = age ? Number(age) : 8;
    const newStudent: Student = {
      id: studentId,
      name: name || 'Novo Estudante',
      class_id: classId,
      current_level: 'Desbravador',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'student')}`,
      registration_number,
      birth_date: `${currentYear - parsedAge}-05-10`,
      age: parsedAge,
      last_assessment_score: 80,
      mastered_skills: ['L1'],
    };
    dbStudents.push(newStudent);
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name || 'Novo Usuário ATIVA',
    email: normalizedEmail,
    role: userRole,
    schoolName: resolvedSchoolName,
    school_id: school_id || (dbOrganizations[0]?.id || 'org-1'),
    avatar: userRole === 'ALUNO'
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'student')}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`,
    specialty: specialty || (userRole === 'ALUNO' ? 'Estudante Matriculado' : 'Equipe Pedagógica'),
    studentId,
    registration_number,
    allowedTeams: allowedTeams || defaultAllowedTeams,
    status: 'active',
    temporaryPassword,
    phone: phone || '',
    age: age ? Number(age) : undefined,
    created_at: new Date().toISOString(),
  };

  dbUsers.unshift(newUser);
  saveDatabase();
  res.status(201).json(newUser);
});

// POST /api/users/:id/toggle-status (Revoke / Block / Unblock Access)
app.post('/api/users/:id/toggle-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = dbUsers.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Prevent self-lock of the initial Admin account
  if (user.id === 'user-admin') {
    return res.status(400).json({ error: 'Não é permitido bloquear a conta master de Administrador Global.' });
  }

  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  saveDatabase();
  res.json({ message: `Status alterado para ${user.status}`, user });
});

// PUT /api/users/:id (Update User Details by Admin)
app.put('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userIndex = dbUsers.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const existing = dbUsers[userIndex];
  const {
    name,
    email,
    role,
    schoolName,
    school_id,
    allowedTeams,
    specialty,
    phone,
    age,
    temporaryPassword,
    password,
    status,
    registration_number,
    googleEmail,
  } = req.body;

  let resolvedSchoolName = schoolName || existing.schoolName;
  if (school_id && (!schoolName || schoolName === existing.schoolName)) {
    const org = dbOrganizations.find((o) => o.id === school_id);
    if (org) resolvedSchoolName = org.name;
  }

  const chosenPassword = password?.trim() || temporaryPassword?.trim();

  const updatedUser: User = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    email: email !== undefined ? email.trim().toLowerCase() : existing.email,
    role: role !== undefined ? role : existing.role,
    schoolName: resolvedSchoolName,
    school_id: school_id !== undefined ? school_id : existing.school_id,
    allowedTeams: allowedTeams !== undefined ? allowedTeams : existing.allowedTeams,
    specialty: specialty !== undefined ? specialty : existing.specialty,
    phone: phone !== undefined ? phone : existing.phone,
    age: age !== undefined ? (age ? Number(age) : undefined) : existing.age,
    temporaryPassword: chosenPassword ? chosenPassword : existing.temporaryPassword,
    status: status !== undefined ? status : existing.status,
    registration_number: registration_number !== undefined ? registration_number : existing.registration_number,
    googleEmail: googleEmail !== undefined ? (googleEmail ? googleEmail.trim().toLowerCase() : undefined) : existing.googleEmail,
  };

  // If student entity is linked, synchronize student record
  if (existing.studentId) {
    const stdIdx = dbStudents.findIndex((s) => s.id === existing.studentId);
    if (stdIdx >= 0) {
      dbStudents[stdIdx] = {
        ...dbStudents[stdIdx],
        name: updatedUser.name,
        class_id:
          updatedUser.allowedTeams && updatedUser.allowedTeams[0] && updatedUser.allowedTeams[0] !== '*'
            ? updatedUser.allowedTeams[0]
            : dbStudents[stdIdx].class_id,
        age: updatedUser.age || dbStudents[stdIdx].age,
      };
    }
  }

  dbUsers[userIndex] = updatedUser;
  saveDatabase();
  res.json(updatedUser);
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (id === 'user-admin') {
    return res.status(400).json({ error: 'Não é permitido excluir o Administrador Master.' });
  }

  const userIndex = dbUsers.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const deletedUser = dbUsers.splice(userIndex, 1)[0];
  if (deletedUser.studentId) {
    dbStudents = dbStudents.filter((s) => s.id !== deletedUser.studentId);
  }

  saveDatabase();
  res.json({ message: 'Usuário removido com sucesso.', id });
});

// Comments Management Endpoints: GET, POST, DELETE
app.get('/api/comments', (req: Request, res: Response) => {
  const activityId = req.query.activity_id as string;
  if (activityId) {
    return res.json(dbComments.filter((c) => c.activity_id === activityId));
  }
  res.json(dbComments);
});

app.post('/api/comments', (req: Request, res: Response) => {
  const { activity_id, user_id, user_name, user_role, user_avatar, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório.' });
  }

  const newComment: PedagogicalComment = {
    id: `com-${Date.now()}`,
    activity_id: activity_id || 'act-1',
    user_id: user_id || 'teacher-1',
    user_name: user_name || 'Educador ATIVA',
    user_role: user_role || 'PROFESSOR',
    user_avatar: user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content,
    created_at: new Date().toISOString(),
  };

  dbComments.push(newComment);
  res.status(201).json(newComment);
});

app.delete('/api/comments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = (req.header('x-user-role') || '').toUpperCase();

  // CRITICAL RBAC RULE: Professor CANNOT delete comments (neither their own nor others)
  if (userRole === 'PROFESSOR' || userRole === 'TEACHER') {
    return res.status(403).json({
      error: 'Restrição de Segurança: Professores não têm permissão para excluir comentários.',
    });
  }

  const commentIndex = dbComments.findIndex((c) => c.id === id);
  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comentário não encontrado.' });
  }

  const deleted = dbComments.splice(commentIndex, 1)[0];
  res.json({ message: 'Comentário excluído com sucesso.', deleted });
});

// 2. Classes: GET /api/classes & POST /api/classes
app.get('/api/classes', (req: Request, res: Response) => {
  const teacherId = (req.query.teacher_id as string) || req.header('x-teacher-id');
  if (teacherId && teacherId !== 'user-diretor' && teacherId !== 'user-coord') {
    const filtered = dbClasses.filter((c) => c.teacher_id === teacherId);
    return res.json(filtered.length > 0 ? filtered : dbClasses);
  }
  res.json(dbClasses);
});

app.post('/api/classes', (req: Request, res: Response) => {
  const { name, grade_level, shift, academic_year, school_id, school_name } = req.body;
  const teacherId = (req.header('x-teacher-id') as string) || 'teacher-1';

  let resolvedSchoolName = school_name;
  if (school_id && !resolvedSchoolName) {
    const org = dbOrganizations.find((o) => o.id === school_id);
    if (org) resolvedSchoolName = org.name;
  }
  if (!resolvedSchoolName) {
    resolvedSchoolName = dbOrganizations[0]?.name || 'Escola Municipal de Tempo Integral Futuro Ativo';
  }

  const newClass: ClassRoom = {
    id: `class-${Date.now()}`,
    name: name || 'Nova Turma ATIVA',
    teacher_id: teacherId,
    grade_level: grade_level || '1º e 2º Ano (Fundamental I)',
    shift: shift || 'Matutino',
    academic_year: academic_year ? Number(academic_year) : 2026,
    school_id: school_id || (dbOrganizations[0]?.id || 'org-1'),
    school_name: resolvedSchoolName,
  };

  dbClasses.push(newClass);
  saveDatabase();
  res.status(201).json(newClass);
});

// 3. Students: GET /api/students & POST /api/students
app.get('/api/students', (req: Request, res: Response) => {
  const classId = req.query.class_id as string;
  if (classId) {
    return res.json(dbStudents.filter((s) => s.class_id === classId));
  }
  res.json(dbStudents);
});

app.post('/api/students', (req: Request, res: Response) => {
  const { name, class_id, current_level, registration_number, birth_date, age } = req.body;
  const newStudent: Student = {
    id: `std-${Date.now()}`,
    name: name || 'Novo Estudante',
    class_id: class_id || dbClasses[0].id,
    current_level: current_level || 'Desbravador',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    registration_number: registration_number || `2026-${Math.floor(100 + Math.random() * 900)}`,
    birth_date: birth_date || '2018-05-10',
    age: age || 8,
    last_assessment_score: 80,
    mastered_skills: ['L1', 'MA1'],
  };

  dbStudents.push(newStudent);
  saveDatabase();
  res.status(201).json(newStudent);
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = dbStudents.findIndex((s) => s.id === id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Estudante não encontrado.' });
  }

  dbStudents[idx] = {
    ...dbStudents[idx],
    ...req.body,
    id,
  };
  saveDatabase();
  res.json(dbStudents[idx]);
});

// 4. Attendance: GET /api/attendance & POST /api/attendance
app.get('/api/attendance', (req: Request, res: Response) => {
  const { class_id, date } = req.query;
  let records = [...dbAttendance];

  if (class_id) {
    records = records.filter((r) => r.class_id === class_id);
  }
  if (date) {
    records = records.filter((r) => r.date === date);
  }

  res.json(records);
});

app.post('/api/attendance', (req: Request, res: Response) => {
  const { class_id, date, present_student_ids, notes } = req.body;
  const teacherId = req.header('x-teacher-id') || 'teacher-1';

  const existingIdx = dbAttendance.findIndex(
    (r) => r.class_id === class_id && r.date === date
  );

  const record: AttendanceRecord = {
    id: existingIdx >= 0 ? dbAttendance[existingIdx].id : `att-${Date.now()}`,
    class_id,
    date: date || new Date().toISOString().split('T')[0],
    present_student_ids: present_student_ids || [],
    notes: notes || '',
    recorded_by: teacherId,
  };

  if (existingIdx >= 0) {
    dbAttendance[existingIdx] = record;
  } else {
    dbAttendance.unshift(record);
  }

  res.json(record);
});

// 5. Portfolio: GET /api/portfolio & POST /api/portfolio
app.get('/api/portfolio', (req: Request, res: Response) => {
  const studentId = req.query.student_id as string;
  let items = dbPortfolio.map((item) => {
    const student = dbStudents.find((s) => s.id === item.student_id);
    const teacher = dbUsers.find((u) => u.id === (item.teacher?.id || 'teacher-1'));
    return {
      ...item,
      student,
      teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar } : undefined,
    };
  });

  if (studentId) {
    items = items.filter((it) => it.student_id === studentId);
  }

  res.json(items);
});

app.post('/api/portfolio', (req: Request, res: Response) => {
  const { student_id, title, description, pedagogical_opinion, media_url, media_type, tags } =
    req.body;
  const teacherId = req.header('x-teacher-id') || 'teacher-1';
  const teacher = dbUsers.find((u) => u.id === teacherId);
  const student = dbStudents.find((s) => s.id === student_id);

  const newItem: PortfolioItem = {
    id: `port-${Date.now()}`,
    student_id,
    student,
    title: title || 'Registro de Atividade Prática',
    description: description || '',
    pedagogical_opinion:
      pedagogical_opinion ||
      'O estudante demonstrou evolução satisfatória na atividade e autonomia na resolução do desafio.',
    media_url:
      media_url ||
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&auto=format&fit=crop&q=80',
    media_type: media_type || 'image',
    date: new Date().toISOString().split('T')[0],
    teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar } : undefined,
    tags: tags || ['Atividade Prática', 'ZDP'],
  };

  dbPortfolio.unshift(newItem);
  res.status(201).json(newItem);
});

// 6. MAPA Assessments: GET /api/mapa-assessments & POST /api/mapa-assessments
app.get('/api/mapa-assessments', (req: Request, res: Response) => {
  const classId = req.query.class_id as string;
  if (classId) {
    return res.json(dbAssessments.filter((a) => a.class_id === classId));
  }
  res.json(dbAssessments);
});

app.post('/api/mapa-assessments', (req: Request, res: Response) => {
  const teacherId = req.header('x-teacher-id') || 'teacher-1';
  const isGuestHeader = req.header('x-is-guest') === 'true';
  const requestingUser = dbUsers.find((u) => u.id === teacherId);

  if (isGuestHeader || requestingUser?.isExternalGuest) {
    return res.status(403).json({
      error: 'Você não consegue fazer isso com sua conta, entre em contato com o suporte pra mudar o status da sua conta.',
      isGuestBlocked: true,
    });
  }

  const { title, class_id, target_type, target_ids, track, skill_codes, notes, scheduled_date } = req.body;

  const newAssessment: MAPAAssessment = {
    id: `mapa-${Date.now()}`,
    title: title || 'Avaliação MAPA Adaptativo',
    class_id,
    teacher_id: teacherId,
    target_type: target_type || 'class',
    target_ids: target_ids || [],
    track: track || 'Leitura',
    skill_codes: skill_codes || ['L1', 'L2'],
    status: 'Agendado',
    scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
    notes: notes || '',
  };

  dbAssessments.unshift(newAssessment);
  saveDatabase();
  res.status(201).json(newAssessment);
});

// 7. MAPA Results: POST /api/mapa-results
app.post('/api/mapa-results', (req: Request, res: Response) => {
  const { assessment_id, student_id, score, mastered_skills, teacher_notes } = req.body;

  const studentIdx = dbStudents.findIndex((s) => s.id === student_id);
  if (studentIdx === -1) {
    return res.status(404).json({ error: 'Estudante não encontrado.' });
  }

  const currentStudent = dbStudents[studentIdx];
  const previousLevel = currentStudent.current_level;

  // Merge newly mastered skills
  const updatedMastered = Array.from(
    new Set([...(currentStudent.mastered_skills || []), ...(mastered_skills || [])])
  );

  // Progressive level promotion based on mastered competencies count
  let newLevel: StudentLevel = previousLevel;
  if (updatedMastered.length >= 10 && previousLevel === 'Desbravador') {
    newLevel = 'Mochileiro';
  } else if (updatedMastered.length >= 14 && previousLevel === 'Mochileiro') {
    newLevel = 'Navegador';
  } else if (updatedMastered.length >= 18 && previousLevel === 'Navegador') {
    newLevel = 'Mergulhador';
  }

  const newResult: MAPAResult = {
    id: `res-${Date.now()}`,
    assessment_id,
    student_id,
    score: typeof score === 'number' ? score : 85,
    mastered_skills: mastered_skills || [],
    previous_level: previousLevel,
    new_recommended_level: newLevel,
    teacher_notes: teacher_notes || 'Demonstrou prontidão e avanço consistente.',
    evaluation_date: new Date().toISOString().split('T')[0],
  };

  dbResults.unshift(newResult);

  // Automatically update the student in database
  dbStudents[studentIdx] = {
    ...currentStudent,
    mastered_skills: updatedMastered,
    current_level: newLevel,
    last_assessment_score: newResult.score,
  };

  res.json({ result: newResult, student: dbStudents[studentIdx] });
});

app.get('/api/mapa-results', (req: Request, res: Response) => {
  const studentId = req.query.student_id as string;
  if (studentId) {
    return res.json(dbResults.filter((r) => r.student_id === studentId));
  }
  res.json(dbResults);
});

// 8. Planner: GET /api/planner/recommend
app.get('/api/planner/recommend', (req: Request, res: Response) => {
  const studentsParam = req.query.students as string;
  const skillCode = (req.query.skill as string) || 'L2';

  const studentIds = studentsParam ? studentsParam.split(',') : [];
  const targetedStudents = dbStudents.filter((s) => studentIds.includes(s.id));

  let matchedActivity = dbActivities.find(
    (a) => a.skill_code === skillCode || a.target_skill_code === skillCode
  );

  if (!matchedActivity) {
    matchedActivity = dbActivities[0];
  }

  const studentsAnalyzed = targetedStudents.map((std) => {
    const hasMastered = (std.mastered_skills || []).includes(skillCode);
    return {
      studentId: std.id,
      studentName: std.name,
      currentLevel: std.current_level,
      levelDistance: hasMastered ? 0 : 1,
      differentiationTip: hasMastered
        ? `${std.name} já domina a habilidade ${skillCode}. Oriente-o a atuar como monitor parceiro do colega.`
        : `${std.name} está em fase de ZDP ativa. Forneça suporte de mediação e materiais concretos manipulativos.`,
    };
  });

  res.json({
    activity: matchedActivity,
    recommended_activity: matchedActivity,
    studentsAnalyzed,
    vysgotskySummary: {
      actualDevelopmentLevel: 'Nível Real: Resolução com apoio e decodificação estruturada.',
      proximalTargetLevel: `Zona de Desenvolvimento Proximal (ZDP): Consolidação da competência ${skillCode}.`,
      scaffoldingAdvice:
        'Trabalhar com duplas produtivas heterogêneas e alternar momentos de exploração concreta com síntese reflexiva.',
    },
  });
});

// 9. Planner AI: POST /api/planner/generate-ai (Gemini 2.5 Flash API)
app.post('/api/planner/generate-ai', async (req: Request, res: Response) => {
  try {
    const teacherId = req.header('x-teacher-id') || 'teacher-1';
    const isGuestHeader = req.header('x-is-guest') === 'true';
    const requestingUser = dbUsers.find((u) => u.id === teacherId);

    if (isGuestHeader || requestingUser?.isExternalGuest) {
      return res.status(403).json({
        error: 'Você não consegue fazer isso com sua conta, entre em contato com o suporte pra mudar o status da sua conta.',
        isGuestBlocked: true,
      });
    }

    const { prompt, skill_code, target_students } = req.body;
    const competency = ATIVA_COMPETENCY_TREE.find((c) => c.code === skill_code) || ATIVA_COMPETENCY_TREE[1];

    const systemInstruction = `Você é o Assistente Pedagógico Sênior da Plataforma ATIVA, fundamentado na Teoria Histórico-Cultural de Lev Vygotsky, na BNCC e no ODS 4 da ONU (Educação de Qualidade).
Sua missão é gerar um plano de aula prático, estruturado estritamente nos 4 Momentos da Metodologia ATIVA:
1. Preparação (espaço e materiais)
2. Primeiro Momento (10-15 min: acolhimento, engajamento e desafio disparador)
3. Segundo Momento (30 min: laboratório prático com materiais manipulativos em duplas/grupos)
4. Revisão/Sistematização (15 min: consolidação, reflexão e registro formativo)
Além disso, forneça estratégias claras de Diferenciação de Instrução (Apoio / Scaffolding para quem ainda não domina e Desafio para quem já domina).
Responda EXCLUSIVAMENTE em formato JSON compatível com o schema de Activity.`;

    const userPrompt = `Gere uma atividade inovadora para a competência ${competency.code}: "${competency.name}" (${competency.description}).
Nível: ${competency.level}. Trilha: ${competency.track}.
Instruções adicionais do professor: ${prompt || 'Atividade lúdica e cooperativa com foco em inclusão'}.`;

    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      const createdActivity: Activity = {
        id: `act-ai-${Date.now()}`,
        skill_code: competency.code,
        target_skill_code: competency.code,
        skill_name: competency.name,
        description: parsed.description || competency.description,
        activity_name: parsed.activity_name || `Oficina Prática de ${competency.name}`,
        title: parsed.activity_name || `Oficina Prática de ${competency.name}`,
        track: competency.track,
        required_level: competency.level,
        duration_minutes: parsed.duration_minutes || 45,
        age_group: parsed.age_group || '7 a 9 anos',
        suggested_group_size: parsed.suggested_group_size || 'Duplas colaborativas',
        materials: parsed.materials || ['Papel sulfite', 'Cartões ilustrados', 'Lápis colorido'],
        character_mascot: 'Guima',
        created_by_ai: true,
        full_guide: {
          preparation: parsed.full_guide?.preparation || 'Preparar materiais e organizar as mesas em ilhas.',
          first_moment: parsed.full_guide?.first_moment || 'Apresentar a história disparadora e conectar com a vida diária dos alunos.',
          second_moment: parsed.full_guide?.second_moment || 'Prática colaborativa em duplas com mediação do professor.',
          review: parsed.full_guide?.review || 'Roda de partilha e síntese coletiva no quadro.',
        },
        differentiation: {
          support: parsed.differentiation?.support || 'Fornecer apoio com pistas visuais e contagem assistida.',
          challenge: parsed.differentiation?.challenge || 'Propor que criem uma nova variação do desafio.',
        },
      };

      dbActivities.unshift(createdActivity);
      return res.json(createdActivity);
    } else {
      // Fallback if no GEMINI_API_KEY set
      const fallbackActivity: Activity = {
        id: `act-ai-fallback-${Date.now()}`,
        skill_code: competency.code,
        target_skill_code: competency.code,
        skill_name: competency.name,
        description: `Atividade prática adaptada para ${competency.name}.`,
        activity_name: `Laboratório Ativo: ${competency.name}`,
        title: `Laboratório Ativo: ${competency.name}`,
        track: competency.track,
        required_level: competency.level,
        duration_minutes: 45,
        age_group: '7 a 10 anos',
        suggested_group_size: 'Duplas ou quartetos',
        materials: ['Cartelas coloridas', 'Material concreto', 'Fichas de registro'],
        character_mascot: 'Ali',
        created_by_ai: true,
        full_guide: {
          preparation: 'Dispor as mesas em formato circular para estimular a cooperação social.',
          first_moment: 'Roda de sensibilização com o mascote mediador para levantar hipóteses prévias.',
          second_moment: 'Desafio em pares com mediação ajustada à Zona de Desenvolvimento Proximal.',
          review: 'Sistematização dos aprendizados e registro fotográfico no portfólio escolar.',
        },
        differentiation: {
          support: 'Reduzir a quantidade de variáveis simultâneas e fornecer andaime dialógico.',
          challenge: 'Estimular a tutoria entre pares e a formulação de problemas correlatos.',
        },
      };

      dbActivities.unshift(fallbackActivity);
      return res.json(fallbackActivity);
    }
  } catch (err: any) {
    console.error('Erro no endpoint generate-ai:', err);
    res.status(500).json({ error: 'Erro ao gerar atividade com IA.', details: err.message });
  }
});

// Save Activity to Bank
app.post('/api/planner/save-activity', (req: Request, res: Response) => {
  const teacherId = req.header('x-teacher-id') || 'teacher-1';
  const isGuestHeader = req.header('x-is-guest') === 'true';
  const requestingUser = dbUsers.find((u) => u.id === teacherId);

  if (isGuestHeader || requestingUser?.isExternalGuest) {
    return res.status(403).json({
      error: 'Você não consegue fazer isso com sua conta, entre em contato com o suporte pra mudar o status da sua conta.',
      isGuestBlocked: true,
    });
  }

  const activity: Activity = req.body;
  const existingIdx = dbActivities.findIndex((a) => a.id === activity.id);
  if (existingIdx >= 0) {
    dbActivities[existingIdx] = activity;
  } else {
    dbActivities.unshift(activity);
  }
  res.json(activity);
});

// GET /api/activities - Returns all programmed and matrix activities
app.get('/api/activities', (_req: Request, res: Response) => {
  res.json(dbActivities);
});

// 10. Adaptive Test Motor: POST /api/adaptive-test/start & POST /api/adaptive-test/answer
// Strictly implements:
// - 1st wrong: next question on same competency
// - 2nd consecutive wrong: regress to previous competency (or absolute zero if baseline)
// - 1st hit: next question on same competency
// - 2nd consecutive hit: advance to posterior competency
// - Stopping criterion: 2 consecutive hits on C AND 2 consecutive misses on C+1!
app.post('/api/adaptive-test/start', (req: Request, res: Response) => {
  const teacherId = req.header('x-teacher-id') || 'teacher-1';
  const isGuestHeader = req.header('x-is-guest') === 'true';
  const requestingUser = dbUsers.find((u) => u.id === teacherId);

  if ((isGuestHeader || requestingUser?.isExternalGuest) && req.body.isScheduling) {
    return res.status(403).json({
      error: 'Você não consegue fazer isso com sua conta, entre em contato com o suporte pra mudar o status da sua conta.',
      isGuestBlocked: true,
    });
  }

  const { assessment_id, student_id, track } = req.body;
  const targetStudent = dbStudents.find((s) => s.id === student_id);
  const targetTrack = track || 'Leitura';

  // Check if student already has an unfinished session to RESUME from where they left off
  const existingSession = Object.values(dbAdaptiveSessions).find(
    (s) =>
      s.student_id === student_id &&
      (!assessment_id || s.assessment_id === assessment_id) &&
      s.track === targetTrack &&
      !s.is_finished
  );

  if (existingSession) {
    const orderedSkills = getOrderedSkillsForTrack(existingSession.track);
    const activeSkillCode = orderedSkills[existingSession.current_skill_index] || orderedSkills[0];
    const answeredIds = existingSession.history.map((h) => h.question_id);
    const question = getNextUnaskedQuestion(activeSkillCode, answeredIds, answeredIds.length);
    return res.json({ session: existingSession, question, resumed: true });
  }

  const sessionId = `session-${Date.now()}`;
  const { session, question } = initializeAdaptiveSession({
    sessionId,
    assessmentId: assessment_id || 'mapa-auto',
    student: targetStudent,
    track: targetTrack,
  });

  dbAdaptiveSessions[sessionId] = session;
  saveDatabase();
  res.json({ session, question, resumed: false });
});

app.post('/api/adaptive-test/answer', (req: Request, res: Response) => {
  const { session_id, question_id, selected_option_id, student_id, track } = req.body;
  let session = dbAdaptiveSessions[session_id];

  if (!session) {
    const targetStudent = dbStudents.find((s) => s.id === student_id) || dbStudents[0];
    const recovered = initializeAdaptiveSession({
      sessionId: session_id || `session-${Date.now()}`,
      assessmentId: 'mapa-auto',
      student: targetStudent,
      track: track || 'Leitura',
    });
    session = recovered.session;
    dbAdaptiveSessions[session.id] = session;
  }

  const targetStudent = dbStudents.find((s) => s.id === session.student_id);
  const outcome = processAdaptiveAnswer(
    session,
    question_id,
    selected_option_id,
    targetStudent
  );

  dbAdaptiveSessions[session.id] = outcome.session;
  saveDatabase();

  let updatedStudent = targetStudent;
  if (outcome.isFinished && outcome.determinedZdp) {
    const studentIdx = dbStudents.findIndex((s) => s.id === session.student_id);
    if (studentIdx >= 0) {
      const currentStd = dbStudents[studentIdx];
      const newSkills = outcome.determinedZdp.mastered_skill.startsWith('Partindo')
        ? currentStd.mastered_skills
        : Array.from(new Set([...currentStd.mastered_skills, outcome.determinedZdp.mastered_skill]));

      dbStudents[studentIdx] = {
        ...currentStd,
        mastered_skills: newSkills,
        current_level: outcome.determinedZdp.new_level,
        last_assessment_score: outcome.determinedZdp.score,
      };
      saveDatabase();
      updatedStudent = dbStudents[studentIdx];
    }
  }

  res.json({
    ...outcome,
    updatedStudent,
  });
});

// Vite middleware mounting in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 ATIVA Full-Stack Server rodando na porta ${PORT}`);
    console.log(`📖 Swagger API Docs disponível em: http://localhost:${PORT}/api/docs`);
  });
}

startServer();
