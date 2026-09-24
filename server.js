// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { GoogleGenAI } from "@google/genai";

// src/data/seedData.ts
var SEED_USERS = [
  {
    id: "user-diretor",
    name: "Dra. Maria Helena Guimar\xE3es",
    email: "diretoria@ativa.edu.br",
    role: "DIRETOR",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    specialty: "Gest\xE3o Escolar e Pol\xEDticas P\xFAblicas ODS 4"
  },
  {
    id: "user-coord",
    name: "Prof. Fernando Rocha",
    email: "coordenacao@ativa.edu.br",
    role: "COORDENADOR",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    specialty: "Supervis\xE3o Pedag\xF3gica & Articula\xE7\xE3o BNCC"
  },
  {
    id: "teacher-1",
    name: "Prof. Carlos Drummond",
    email: "carlos@ativa.edu.br",
    role: "PROFESSOR",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    specialty: "Alfabetiza\xE7\xE3o & Letramento (1\xBA ao 3\xBA Ano)"
  },
  {
    id: "teacher-2",
    name: "Profa. Clarice Lispector",
    email: "clarice@ativa.edu.br",
    role: "PROFESSOR",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    specialty: "Linguagens, Produ\xE7\xE3o Textual e Matem\xE1tica"
  },
  {
    id: "user-aluno-1",
    name: "Sofia Mendes",
    email: "sofia.mendes@aluno.ativa.edu.br",
    role: "ALUNO",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    specialty: "N\xEDvel Desbravador \u2022 Foco em Rimas e Contagem",
    studentId: "std-1"
  },
  {
    id: "user-aluno-2",
    name: "Lucas Silva",
    email: "lucas.silva@aluno.ativa.edu.br",
    role: "ALUNO",
    schoolName: "Escola Municipal de Tempo Integral Futuro Ativo",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    specialty: "N\xEDvel Desbravador \u2022 Leitura de S\xEDlabas",
    studentId: "std-2"
  }
];
var SEED_CLASSES = [
  {
    id: "class-1",
    name: "Turma 101 - Desbravadores do Saber",
    teacher_id: "teacher-1",
    grade_level: "1\xBA e 2\xBA Ano (Fundamental I)",
    shift: "Matutino",
    academic_year: 2026
  },
  {
    id: "class-2",
    name: "Turma 201 - Mochileiros da Descoberta",
    teacher_id: "teacher-1",
    grade_level: "3\xBA Ano (Fundamental I)",
    shift: "Matutino",
    academic_year: 2026
  },
  {
    id: "class-3",
    name: "Turma 301 - Navegadores da Ci\xEAncia",
    teacher_id: "teacher-2",
    grade_level: "4\xBA Ano (Fundamental I)",
    shift: "Vespertino",
    academic_year: 2026
  },
  {
    id: "class-4",
    name: "Turma 401 - Mergulhadores Matem\xE1ticos",
    teacher_id: "teacher-2",
    grade_level: "5\xBA Ano (Fundamental I)",
    shift: "Integral",
    academic_year: 2026
  }
];
var SEED_STUDENTS = [
  {
    id: "std-1",
    name: "Sofia Mendes",
    class_id: "class-1",
    current_level: "Desbravador",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-001",
    birth_date: "2019-04-14",
    age: 7,
    last_assessment_score: 85,
    mastered_skills: ["L1", "L3", "L5", "MA1", "MA2", "H1"]
  },
  {
    id: "std-2",
    name: "Lucas Silva",
    class_id: "class-1",
    current_level: "Desbravador",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-002",
    birth_date: "2018-09-21",
    age: 8,
    last_assessment_score: 80,
    mastered_skills: ["L1", "L3", "MA1", "H1", "H2"]
  },
  {
    id: "std-3",
    name: "Beatriz Ramos",
    class_id: "class-1",
    current_level: "Desbravador",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-003",
    birth_date: "2019-02-10",
    age: 7,
    last_assessment_score: 90,
    mastered_skills: ["L1", "L2", "L3", "L5", "MA1", "MA2", "MA3", "H6"]
  },
  {
    id: "std-4",
    name: "Gabriel Souza",
    class_id: "class-1",
    current_level: "Mochileiro",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-004",
    birth_date: "2017-11-05",
    age: 9,
    last_assessment_score: 88,
    mastered_skills: ["L1", "L2", "L3", "L5", "L9", "L13", "MA1", "MA2", "MA3", "MA7", "MA9", "H1", "H6"]
  },
  {
    id: "std-5",
    name: "Helena Carvalho",
    class_id: "class-1",
    current_level: "Desbravador",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-005",
    birth_date: "2018-07-30",
    age: 8,
    last_assessment_score: 75,
    mastered_skills: ["L1", "L3", "MA1", "MA2", "H1"]
  },
  {
    id: "std-6",
    name: "Manuela Lima",
    class_id: "class-2",
    current_level: "Mochileiro",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-006",
    birth_date: "2017-05-18",
    age: 9,
    last_assessment_score: 92,
    mastered_skills: ["L1", "L2", "L3", "L5", "L9", "L13", "L38", "MA1", "MA3", "MA9", "MA11", "MA15", "H6", "H7"]
  },
  {
    id: "std-7",
    name: "Enzo Fernandes",
    class_id: "class-2",
    current_level: "Mochileiro",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-007",
    birth_date: "2017-08-22",
    age: 9,
    last_assessment_score: 82,
    mastered_skills: ["L1", "L2", "L9", "L13", "MA1", "MA7", "MA9", "MA15", "H1", "H6"]
  },
  {
    id: "std-8",
    name: "J\xFAlia Oliveira",
    class_id: "class-3",
    current_level: "Navegador",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-008",
    birth_date: "2016-03-12",
    age: 10,
    last_assessment_score: 94,
    mastered_skills: ["L1", "L2", "L13", "L38", "L42", "L52", "MA1", "MA9", "MA15", "MA26", "MA34", "H6", "H11"]
  },
  {
    id: "std-9",
    name: "Matheus Costa",
    class_id: "class-4",
    current_level: "Mergulhador",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-009",
    birth_date: "2015-10-04",
    age: 11,
    last_assessment_score: 91,
    mastered_skills: ["L1", "L2", "L38", "L52", "L62", "L66", "MA15", "MA26", "MA34", "MA44", "H11", "H14"]
  },
  {
    id: "std-10",
    name: "Larissa Santos",
    class_id: "class-4",
    current_level: "Alpinista",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    registration_number: "2026-010",
    birth_date: "2014-06-25",
    age: 12,
    last_assessment_score: 95,
    mastered_skills: ["L38", "L52", "L66", "L76", "L86", "MA34", "MA44", "MA53", "E55", "H14", "H16"]
  }
];
var SEED_ACTIVITIES = [
  // 1. CARGA INICIAL OBRIGATÓRIA 1: Habilidade L2 (Nível Desbravador)
  {
    id: "act-l2-minhas-rimas",
    skill_code: "L2",
    target_skill_code: "L2",
    skill_name: "Discrimina\xE7\xE3o de Rimas Finais",
    description: "Discrimina sons semelhantes no final da palavra (rimas como: p\xE3o - ch\xE3o e fim - sim).",
    activity_name: "Minhas rimas",
    title: "Minhas rimas",
    track: "Leitura",
    required_level: "Desbravador",
    duration_minutes: 50,
    age_group: "6 a 8 anos",
    suggested_group_size: "Duplas ou pequenos grupos de 4 alunos",
    materials: ["Impress\xE3o do PDF de jogo da mem\xF3ria", "Cartelas ilustradas com pares de rimas", "Tesoura sem ponta", "Envelope organizador"],
    character_mascot: "Guima",
    full_guide: {
      preparation: "Imprimir e recortar as cartelas do jogo da mem\xF3ria com anteced\xEAncia. Organizar a sala em duplas de modo que alunos em diferentes est\xE1gios de percep\xE7\xE3o fonol\xF3gica trabalhem juntos.",
      first_moment: 'Roda de conversa inicial e sensibiliza\xE7\xE3o sonora: O educador entoa uma parlenda cl\xE1ssica (ex.: "Hoje \xE9 domingo, pede cachimbo, o cachimbo \xE9 de ouro, bate no touro..."). Pergunta \xE0s crian\xE7as quais palavras terminam com sons parecidos e escreve no quadro com cores contrastantes.',
      second_moment: 'Din\xE2mica das Cartas Misteriosas: As duplas recebem as cartas viradas para baixo. A cada rodada, o aluno desvira duas cartas, pronuncia em voz alta os nomes dos objetos (ex.: "M\xC3O" e "AVI\xC3O") e bate palmas caso perceba a termina\xE7\xE3o id\xEAntica.',
      review: "Sistematiza\xE7\xE3o e registro no painel da turma: Cada dupla escolhe seu par de rimas favorito e compartilha em voz alta para os colegas. O professor valida os acertos e registra no portf\xF3lio digital."
    },
    differentiation: {
      support: 'Para alunos que ainda n\xE3o discriminam a termina\xE7\xE3o fonol\xF3gica, o educador alonga o som final com entona\xE7\xE3o enf\xE1tica ("p\xE3\xE3\xE3ooo... ch\xE3\xE3\xE3ooo") e utiliza suporte visual direto das imagens.',
      challenge: "Para alunos que j\xE1 dominam com facilidade, propor que criem oralmente uma terceira palavra que rime com o par encontrado antes de recolher a carta."
    }
  },
  // 2. CARGA INICIAL OBRIGATÓRIA 2: Habilidade MA15 (Nível Mochileiro)
  {
    id: "act-ma15-descobrindo-diferencas",
    skill_code: "MA15",
    target_skill_code: "MA15",
    skill_name: "Fatos B\xE1sicos da Subtra\xE7\xE3o",
    description: "Utiliza os fatos b\xE1sicos da subtra\xE7\xE3o (conceito da subtra\xE7\xE3o).",
    activity_name: "Descobrindo diferen\xE7as",
    title: "Descobrindo diferen\xE7as",
    track: "Matem\xE1tica",
    required_level: "Mochileiro",
    duration_minutes: 35,
    age_group: "8 a 9 anos",
    suggested_group_size: "Grupos de 3 a 4 alunos",
    materials: ["Saco de feij\xE3o", "Envelopes numerados", "Papel sulfite", "L\xE1pis grafite"],
    character_mascot: "Cl\xE9o",
    full_guide: {
      preparation: "Separar saquinhos com gr\xE3os de feij\xE3o (exatamente 20 gr\xE3os por grupo) e envelopes com cartelas de desafios matem\xE1ticos previamente preparadas.",
      first_moment: "Sensibiliza\xE7\xE3o com narrativa l\xFAdica: O professor apresenta o mascote Cl\xE9o que tinha 12 sementes em sua fazenda e precisou plantar 5. Quantas sementes restaram para guardar no celeiro? Discuss\xE3o em grupo sobre a opera\xE7\xE3o realizada.",
      second_moment: "Laborat\xF3rio Concreto: Os alunos manipulam os gr\xE3os de feij\xE3o concretamente sobre a mesa para calcular as subtra\xE7\xF5es dos envelopes. Eles registram tanto o desenho dos feij\xF5es quanto a senten\xE7a matem\xE1tica formal (ex.: 15 - 7 = 8) na folha sulfite.",
      review: "Fechamento e verifica\xE7\xE3o: Cada grupo apresenta uma estrat\xE9gia de contagem regressiva ou c\xE1lculo mental encontrada durante a din\xE2mica."
    },
    differentiation: {
      support: "Utilizar a reta num\xE9rica f\xEDsica ou desenhada na mesa para fazer o movimento de saltos para tr\xE1s a cada elemento subtra\xEDdo.",
      challenge: 'Apresentar problemas que envolvam a ideia comparativa ("Quantos feij\xF5es o grupo A tem a mais que o grupo B?").'
    }
  },
  // 3. CARGA INICIAL OBRIGATÓRIA 3: Habilidade H6 (Habilidades para a Vida)
  {
    id: "act-h6-manual-do-coracao",
    skill_code: "H6",
    target_skill_code: "H6",
    skill_name: "Reconhecimento e Nomea\xE7\xE3o de Emo\xE7\xF5es",
    description: "Consegue reconhecer e nomear emo\xE7\xF5es que sente.",
    activity_name: "Manual do cora\xE7\xE3o",
    title: "Manual do cora\xE7\xE3o",
    track: "Habilidades para a Vida",
    required_level: "Desbravador",
    duration_minutes: 35,
    age_group: "6 a 9 anos",
    suggested_group_size: "Individual com partilha em grande roda",
    materials: ["Atividade impressa com silhueta do cora\xE7\xE3o", "L\xE1pis de cor", "Canetinha hidrocor"],
    character_mascot: "Garu",
    full_guide: {
      preparation: "Imprimir a folha com a silhueta grande de um cora\xE7\xE3o dividido em se\xE7\xF5es livres e disponibilizar canetinhas coloridas nas mesas.",
      first_moment: 'Acolhimento afetivo: Roda de conversa inicial com o term\xF4metro das emo\xE7\xF5es. O educador pergunta: "Onde voc\xEA sente a alegria no corpo? E o medo? Como o cora\xE7\xE3o reage quando estamos bravos?"',
      second_moment: "Ateli\xEA do Cora\xE7\xE3o: Cada crian\xE7a preenche sua folha atribuindo cores para cada emo\xE7\xE3o que sentiu na semana (ex.: amarelo para alegria, azul para calma, vermelho para raiva). Em seguida, escrevem ou desenham pequenas situa\xE7\xF5es que despertaram cada uma.",
      review: "Roda da Empatia: Quem desejar compartilha seu mapa de cores com os colegas. O educador refor\xE7a que todas as emo\xE7\xF5es s\xE3o leg\xEDtimas e que saber nome\xE1-las \xE9 o primeiro passo para o autocuidado."
    },
    differentiation: {
      support: "Apoiar crian\xE7as que t\xEAm dificuldade verbal com cart\xF5es visuais dos personagens do term\xF4metro de sentimentos para apontar.",
      challenge: "Pedir que o estudante descreva uma estrat\xE9gia positiva de autorregula\xE7\xE3o que ele utiliza quando sente raiva ou frustra\xE7\xE3o."
    }
  },
  // 4. ATIVIDADES ADICIONAIS EXPANSIVAS DA MATRIZ
  {
    id: "act-l1-cacadores-de-sons",
    skill_code: "L1",
    target_skill_code: "L1",
    skill_name: "Discrimina\xE7\xE3o Fonol\xF3gica Inicial",
    description: "Discrimina sons das letras no in\xEDcio de uma s\xEDlaba.",
    activity_name: "Ca\xE7adores de sons iniciais",
    title: "Ca\xE7adores de sons iniciais",
    track: "Leitura",
    required_level: "Desbravador",
    duration_minutes: 40,
    age_group: "6 a 7 anos",
    suggested_group_size: "Grupos de 4 alunos",
    materials: ["Caixa surpresa", "Objetos do cotidiano (bola, boneca, pato, tampa, dado)", "Fichas ilustradas"],
    character_mascot: "Guima",
    full_guide: {
      preparation: "Colocar dentro da caixa surpresa objetos cujos nomes comecem com sons contrastantes (ex.: /b/, /p/, /t/, /d/).",
      first_moment: "O educador retira um objeto misterioso e emite apenas o som inicial da palavra, solicitando que as crian\xE7as adivinhem o nome.",
      second_moment: "As crian\xE7as se dividem em grupos para ca\xE7ar na sala outros objetos que comecem com o mesmo som da ficha atribu\xEDda ao grupo.",
      review: "Apresenta\xE7\xE3o no tapete e valida\xE7\xE3o fonol\xF3gica coletiva."
    },
    differentiation: {
      support: "Focar em sons consonantais cont\xEDnuos e f\xE1ceis de prolongar (/m/, /s/, /f/, /v/).",
      challenge: "Trabalhar com contrastes m\xEDnimos de sonoridade (/p/ e /b/, /t/ e /d/)."
    }
  },
  {
    id: "act-ma9-estacao-da-soma",
    skill_code: "MA9",
    target_skill_code: "MA9",
    skill_name: "Fatos B\xE1sicos da Adi\xE7\xE3o Concreta",
    description: "Utiliza fatos b\xE1sicos da adi\xE7\xE3o com suporte de material manipul\xE1vel.",
    activity_name: "Esta\xE7\xE3o da soma divertida",
    title: "Esta\xE7\xE3o da soma divertida",
    track: "Matem\xE1tica",
    required_level: "Desbravador",
    duration_minutes: 45,
    age_group: "6 a 8 anos",
    suggested_group_size: "Duplas colaborativas",
    materials: ["Tampinhas de garrafa coloridas", "Dado num\xE9rico de 1 a 6", "Cartelas de bingo de adi\xE7\xE3o"],
    character_mascot: "Cl\xE9o",
    full_guide: {
      preparation: "Organizar potes com 30 tampinhas por mesa e dados num\xE9ricos.",
      first_moment: "O educador lan\xE7a dois dados grandes na frente da sala e convida um aluno a somar as quantidades com as tampinhas.",
      second_moment: "Em duplas, os alunos rolam seus dados, agrupam as tampinhas correspondentes e marcam o total na cartela.",
      review: "Reflex\xE3o sobre as diferentes maneiras de compor um mesmo n\xFAmero (ex.: 3+3=6 e 4+2=6)."
    },
    differentiation: {
      support: "Usar dados com pontinhos em vez de algarismos num\xE9ricos para possibilitar contagem um a um.",
      challenge: 'Incentivar o c\xE1lculo mental a partir do maior n\xFAmero (ex.: "Guarde 5 na cabe\xE7a e conte mais 3 nos dedos").'
    }
  },
  {
    id: "act-l38-fabrica-de-silabas",
    skill_code: "L38",
    target_skill_code: "L38",
    skill_name: "Classifica\xE7\xE3o Sil\xE1bica",
    description: "Identifica o n\xFAmero de s\xEDlabas das palavras classificando-as.",
    activity_name: "F\xE1brica de s\xEDlabas e palmas",
    title: "F\xE1brica de s\xEDlabas e palmas",
    track: "Leitura",
    required_level: "Mochileiro",
    duration_minutes: 45,
    age_group: "8 a 9 anos",
    suggested_group_size: "Trio de alunos",
    materials: ["Cart\xF5es com palavras escritas", "Caixas organizadoras rotuladas (1, 2, 3, 4+ s\xEDlabas)"],
    character_mascot: "Guima",
    full_guide: {
      preparation: "Distribuir fichas com voc\xE1bulos variados e colocar as 4 caixas no centro da sala.",
      first_moment: "Din\xE2mica do eco: O educador fala uma palavra e todos batem palmas para cada emiss\xE3o sonora da voz.",
      second_moment: "Os trios leem os cart\xF5es e organizam as palavras nas caixas correspondentes (monoss\xEDlabas a poliss\xEDlabas).",
      review: "Confer\xEAncia em grupo com leitura e justifica\xE7\xE3o sil\xE1bica."
    },
    differentiation: {
      support: "Auxiliar na segmenta\xE7\xE3o r\xEDtmica tocando palmas com as m\xE3os da crian\xE7a.",
      challenge: "Pedir que o estudante identifique e destaque a s\xEDlaba t\xF4nica da palavra classificada."
    }
  },
  {
    id: "act-ma26-batalha-da-tabuada",
    skill_code: "MA26",
    target_skill_code: "MA26",
    skill_name: "Fatos B\xE1sicos da Multiplica\xE7\xE3o",
    description: "Utiliza os fatos b\xE1sicos da multiplica\xE7\xE3o construindo as rela\xE7\xF5es da tabuada.",
    activity_name: "Batalha da tabuada retangular",
    title: "Batalha da tabuada retangular",
    track: "Matem\xE1tica",
    required_level: "Mochileiro",
    duration_minutes: 40,
    age_group: "8 a 10 anos",
    suggested_group_size: "Duplas",
    materials: ["Folha quadriculada de 1cm", "Dois dados de 1 a 6", "L\xE1pis de cor de cores diferentes"],
    character_mascot: "Cl\xE9o",
    full_guide: {
      preparation: "Entregar a cada dupla uma folha quadriculada grande e 2 dados.",
      first_moment: "Explicar que a multiplica\xE7\xE3o representa uma malha retangular (ex.: 3 x 4 s\xE3o 3 linhas com 4 quadradinhos).",
      second_moment: "A cada rodada o aluno joga os dados, desenha o ret\xE2ngulo correspondente na folha com sua cor e anota a \xE1rea.",
      review: "Quem ocupou mais espa\xE7o no territ\xF3rio? Discuss\xE3o sobre a propriedade comutativa (3x4 = 4x3)."
    },
    differentiation: {
      support: "Trabalhar inicialmente apenas com multiplica\xE7\xF5es por 2 e por 5.",
      challenge: "Adicionar dados com n\xFAmeros at\xE9 10 para multiplica\xE7\xE3o de fatores maiores."
    }
  }
];
var SEED_ASSESSMENTS = [
  {
    id: "mapa-101",
    title: "MAPA Diagn\xF3stico Ciclo 1 \u2022 Consci\xEAncia Fonol\xF3gica e N\xFAmeros",
    class_id: "class-1",
    teacher_id: "teacher-1",
    target_type: "class",
    target_ids: ["std-1", "std-2", "std-3", "std-4", "std-5"],
    track: "Leitura",
    skill_codes: ["L1", "L2", "L3", "L5"],
    status: "Aplicado",
    scheduled_date: "2026-03-10",
    applied_at: "2026-03-12 10:30:00",
    notes: "Avalia\xE7\xE3o inicial de leitura para mapear as compet\xEAncias de entrada."
  },
  {
    id: "mapa-102",
    title: "MAPA Adaptativo de Subtra\xE7\xE3o e Resolu\xE7\xE3o de Problemas",
    class_id: "class-1",
    teacher_id: "teacher-1",
    target_type: "group",
    target_ids: ["std-1", "std-3", "std-4"],
    track: "Matem\xE1tica",
    skill_codes: ["MA9", "MA15"],
    status: "Agendado",
    scheduled_date: "2026-03-25",
    notes: "Sondagem formativa em pequenos grupos para consolida\xE7\xE3o da ZDP."
  },
  {
    id: "mapa-103",
    title: "MAPA Interven\xE7\xE3o \u2022 Rimas e Alitera\xE7\xE3o",
    class_id: "class-1",
    teacher_id: "teacher-1",
    target_type: "student",
    target_ids: ["std-2"],
    track: "Leitura",
    skill_codes: ["L2"],
    status: "Agendado",
    scheduled_date: "2026-03-28",
    notes: "Atendimento individualizado para o estudante Lucas Silva."
  }
];
var SEED_RESULTS = [
  {
    id: "res-1",
    assessment_id: "mapa-101",
    student_id: "std-1",
    score: 85,
    mastered_skills: ["L1", "L3", "L5"],
    previous_level: "Desbravador",
    new_recommended_level: "Desbravador",
    teacher_notes: "Sofia demonstrou excelente discrimina\xE7\xE3o de vogais e letras do alfabeto. O pr\xF3ximo passo da ZDP \xE9 a consolida\xE7\xE3o de rimas (L2).",
    evaluation_date: "2026-03-12"
  },
  {
    id: "res-2",
    assessment_id: "mapa-101",
    student_id: "std-3",
    score: 95,
    mastered_skills: ["L1", "L2", "L3", "L5"],
    previous_level: "Desbravador",
    new_recommended_level: "Desbravador",
    teacher_notes: "Beatriz conquistou a habilidade L2 com dom\xEDnio de pares de rimas. J\xE1 pode avan\xE7ar para a leitura de s\xEDlabas can\xF4nicas.",
    evaluation_date: "2026-03-12"
  },
  {
    id: "res-3",
    assessment_id: "mapa-101",
    student_id: "std-4",
    score: 92,
    mastered_skills: ["L1", "L2", "L3", "L5", "L9", "L13"],
    previous_level: "Desbravador",
    new_recommended_level: "Mochileiro",
    teacher_notes: "Evolu\xE7\xE3o consistente na ZDP. Gabriel superou os desafios iniciais e avan\xE7ou oficialmente para o n\xEDvel Mochileiro.",
    evaluation_date: "2026-03-12"
  }
];
var SEED_ATTENDANCE = [
  {
    id: "att-1",
    class_id: "class-1",
    date: "2026-03-20",
    present_student_ids: ["std-1", "std-2", "std-3", "std-4", "std-5"],
    notes: "Presen\xE7a total da turma na oficina de leitura.",
    recorded_by: "teacher-1"
  },
  {
    id: "att-2",
    class_id: "class-1",
    date: "2026-03-21",
    present_student_ids: ["std-1", "std-3", "std-4", "std-5"],
    notes: "Lucas ausente por motivo de sa\xFAde familiar.",
    recorded_by: "teacher-1"
  },
  {
    id: "att-3",
    class_id: "class-1",
    date: "2026-03-22",
    present_student_ids: ["std-1", "std-2", "std-3", "std-4"],
    notes: "Helena ausente com justificativa m\xE9dica.",
    recorded_by: "teacher-1"
  }
];
var SEED_PORTFOLIO = [
  {
    id: "port-1",
    student_id: "std-1",
    title: "Produ\xE7\xE3o das Cartas de Rimas no Ateli\xEA",
    description: 'Sofia desenhou e escreveu pares de palavras que rimam: "C\xC3O" e "BAL\xC3O", "M\xC3O" e "LIM\xC3O".',
    pedagogical_opinion: "A estudante demonstrou autonomia crescente na percep\xE7\xE3o dos sons finais, associando o grafema ao fonema correspondente com entusiasmo.",
    media_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&auto=format&fit=crop&q=80",
    media_type: "image",
    date: "2026-03-15",
    tags: ["L2", "Rimas", "Trabalho em Dupla", "Produ\xE7\xE3o Gr\xE1fica"]
  },
  {
    id: "port-2",
    student_id: "std-3",
    title: "Constru\xE7\xE3o da Reta Num\xE9rica com Tampinhas",
    description: "Beatriz organizou as tampinhas coloridas de 1 a 20 e realizou somas concretas com seu par.",
    pedagogical_opinion: "Excelente racioc\xEDnio l\xF3gico e coopera\xE7\xE3o m\xFAtua. Orientou o colega que estava com d\xFAvida na passagem da dezena.",
    media_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&auto=format&fit=crop&q=80",
    media_type: "image",
    date: "2026-03-18",
    tags: ["MA3", "MA9", "Matem\xE1tica Concreta", "Coopera\xE7\xE3o"]
  },
  {
    id: "port-3",
    student_id: "std-4",
    title: "Painel das Emo\xE7\xF5es no Manual do Cora\xE7\xE3o",
    description: "Gabriel preencheu seu mapa de sentimentos associando cores e relatando epis\xF3dios de tranquilidade e foco.",
    pedagogical_opinion: "Grande maturidade no reconhecimento de emo\xE7\xF5es e autorregula\xE7\xE3o durante as atividades em pequenos grupos.",
    media_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=700&auto=format&fit=crop&q=80",
    media_type: "image",
    date: "2026-03-19",
    tags: ["H6", "Socioemocional", "Autoconhecimento"]
  }
];
var SEED_ADAPTIVE_QUESTIONS = [
  // L1 (Desbravador)
  {
    id: "q-l1-1",
    skill_code: "L1",
    skill_name: "Discrimina\xE7\xE3o Fonol\xF3gica Inicial",
    track: "Leitura",
    level: "Desbravador",
    statement: 'Qual das palavras abaixo come\xE7a com o mesmo som da palavra "BOLA"?',
    options: [
      { id: "a", text: "BONECA" },
      { id: "b", text: "PATO" },
      { id: "c", text: "CASA" },
      { id: "d", text: "GATO" }
    ],
    correct_option_id: "a",
    explanation: '"BONECA" e "BOLA" iniciam com a mesma s\xEDlaba e com o mesmo som fon\xEAmico /b/.'
  },
  {
    id: "q-l1-2",
    skill_code: "L1",
    skill_name: "Discrimina\xE7\xE3o Fonol\xF3gica Inicial",
    track: "Leitura",
    level: "Desbravador",
    statement: 'Descubra a palavra que come\xE7a com o mesmo som de "PIPA":',
    options: [
      { id: "a", text: "BALA" },
      { id: "b", text: "PATO" },
      { id: "c", text: "DADO" },
      { id: "d", text: "MESA" }
    ],
    correct_option_id: "b",
    explanation: '"PIPA" e "PATO" come\xE7am com o fonema /p/.'
  },
  // L2 (Desbravador)
  {
    id: "q-l2-1",
    skill_code: "L2",
    skill_name: "Discrimina\xE7\xE3o de Rimas Finais",
    track: "Leitura",
    level: "Desbravador",
    statement: 'Qual palavra termina com o mesmo som (rima) de "P\xC3O"?',
    options: [
      { id: "a", text: "CH\xC3O" },
      { id: "b", text: "P\xC9" },
      { id: "c", text: "BOLO" },
      { id: "d", text: "SOL" }
    ],
    correct_option_id: "a",
    explanation: '"P\xC3O" e "CH\xC3O" terminam com a mesma sonoridade nasal "-\xC3O".'
  },
  {
    id: "q-l2-2",
    skill_code: "L2",
    skill_name: "Discrimina\xE7\xE3o de Rimas Finais",
    track: "Leitura",
    level: "Desbravador",
    statement: 'Qual das palavras abaixo rima com "FIM"?',
    options: [
      { id: "a", text: "SIM" },
      { id: "b", text: "CASA" },
      { id: "c", text: "GATO" },
      { id: "d", text: "LUA" }
    ],
    correct_option_id: "a",
    explanation: '"FIM" e "SIM" terminam com a sonoridade id\xEAntica "-IM".'
  },
  // L3 (Desbravador)
  {
    id: "q-l3-1",
    skill_code: "L3",
    skill_name: "Reconhecimento de Letras do Alfabeto",
    track: "Leitura",
    level: "Desbravador",
    statement: "Identifique o grupo que cont\xE9m apenas LETRAS do nosso alfabeto:",
    options: [
      { id: "a", text: "B, M, A, T" },
      { id: "b", text: "3, 7, 9, 2" },
      { id: "c", text: "\u2605, \u2663, \u2660, \u2666" },
      { id: "d", text: "@, #, $, %" }
    ],
    correct_option_id: "a",
    explanation: "B, M, A, T s\xE3o s\xEDmbolos que comp\xF5em o sistema alfab\xE9tico da l\xEDngua portuguesa."
  },
  {
    id: "q-l3-2",
    skill_code: "L3",
    skill_name: "Reconhecimento de Letras do Alfabeto",
    track: "Leitura",
    level: "Desbravador",
    statement: "Qual dos seguintes caracteres \xE9 uma letra?",
    options: [
      { id: "a", text: "R" },
      { id: "b", text: "8" },
      { id: "c", text: "?" },
      { id: "d", text: "+" }
    ],
    correct_option_id: "a",
    explanation: '"R" \xE9 uma consoante do alfabeto.'
  },
  // L13 (Mochileiro - anterior/início)
  {
    id: "q-l13-1",
    skill_code: "L13",
    skill_name: "Composi\xE7\xE3o Sil\xE1bica Can\xF4nica",
    track: "Leitura",
    level: "Mochileiro",
    statement: 'Juntando as s\xEDlabas "BO" e "LO", qual palavra n\xF3s formamos?',
    options: [
      { id: "a", text: "BOLO" },
      { id: "b", text: "LAMA" },
      { id: "c", text: "BOCA" },
      { id: "d", text: "LOBO" }
    ],
    correct_option_id: "a",
    explanation: '"BO" + "LO" = BOLO.'
  },
  {
    id: "q-l13-2",
    skill_code: "L13",
    skill_name: "Composi\xE7\xE3o Sil\xE1bica Can\xF4nica",
    track: "Leitura",
    level: "Mochileiro",
    statement: 'Juntando as s\xEDlabas "PA" e "TO", qual palavra \xE9 formada?',
    options: [
      { id: "a", text: "PATO" },
      { id: "b", text: "BATO" },
      { id: "c", text: "SAPO" },
      { id: "d", text: "TETO" }
    ],
    correct_option_id: "a",
    explanation: '"PA" + "TO" = PATO.'
  },
  // L38 (Mochileiro)
  {
    id: "q-l38-1",
    skill_code: "L38",
    skill_name: "Classifica\xE7\xE3o Sil\xE1bica",
    track: "Leitura",
    level: "Mochileiro",
    statement: 'A palavra "BORBOLETA" possui quantas s\xEDlabas?',
    options: [
      { id: "a", text: "4 s\xEDlabas (Poliss\xEDlaba)" },
      { id: "b", text: "2 s\xEDlabas (Diss\xEDlaba)" },
      { id: "c", text: "3 s\xEDlabas (Triss\xEDlaba)" },
      { id: "d", text: "1 s\xEDlaba (Monoss\xEDlaba)" }
    ],
    correct_option_id: "a",
    explanation: "BOR-BO-LE-TA tem 4 partes sonoras, sendo portanto classificada como poliss\xEDlaba."
  },
  {
    id: "q-l38-2",
    skill_code: "L38",
    skill_name: "Classifica\xE7\xE3o Sil\xE1bica",
    track: "Leitura",
    level: "Mochileiro",
    statement: 'A palavra "SOL" \xE9 classificada como:',
    options: [
      { id: "a", text: "Monoss\xEDlaba" },
      { id: "b", text: "Diss\xEDlaba" },
      { id: "c", text: "Triss\xEDlaba" },
      { id: "d", text: "Poliss\xEDlaba" }
    ],
    correct_option_id: "a",
    explanation: "Possui apenas uma \xFAnica emiss\xE3o de voz (1 s\xEDlaba)."
  },
  // MATEMÁTICA (MA1, MA9, MA15, MA26)
  {
    id: "q-ma1-1",
    skill_code: "MA1",
    skill_name: "N\xFAmeros no Cotidiano",
    track: "Matem\xE1tica",
    level: "Desbravador",
    statement: "Em qual das seguintes situa\xE7\xF5es o n\xFAmero \xE9 usado para indicar uma ORDEM de chegada?",
    options: [
      { id: "a", text: "1\xBA Lugar na corrida" },
      { id: "b", text: "Caneca custa 10 reais" },
      { id: "c", text: "Telefone 9876-5432" },
      { id: "d", text: "A garrafa tem 2 litros" }
    ],
    correct_option_id: "a",
    explanation: "1\xBA Lugar indica ordem ordinal de classifica\xE7\xE3o."
  },
  {
    id: "q-ma1-2",
    skill_code: "MA1",
    skill_name: "N\xFAmeros no Cotidiano",
    track: "Matem\xE1tica",
    level: "Desbravador",
    statement: "Qual dos n\xFAmeros abaixo serve como um C\xD3DIGO de identifica\xE7\xE3o?",
    options: [
      { id: "a", text: "CEP da resid\xEAncia (ex: 01310-100)" },
      { id: "b", text: "3 ma\xE7\xE3s na cesta" },
      { id: "c", text: "2\xBA colocado na fila" },
      { id: "d", text: "5 quilogramas de arroz" }
    ],
    correct_option_id: "a",
    explanation: "O CEP funciona como c\xF3digo postal."
  },
  {
    id: "q-ma9-1",
    skill_code: "MA9",
    skill_name: "Fatos B\xE1sicos da Adi\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Desbravador",
    statement: "Lucas tinha 4 l\xE1pis e ganhou mais 3 de presente. Com quantos l\xE1pis ele ficou?",
    options: [
      { id: "a", text: "7 l\xE1pis" },
      { id: "b", text: "6 l\xE1pis" },
      { id: "c", text: "8 l\xE1pis" },
      { id: "d", text: "1 l\xE1pis" }
    ],
    correct_option_id: "a",
    explanation: "4 + 3 = 7 l\xE1pis."
  },
  {
    id: "q-ma9-2",
    skill_code: "MA9",
    skill_name: "Fatos B\xE1sicos da Adi\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Desbravador",
    statement: "Quanto \xE9 5 + 5?",
    options: [
      { id: "a", text: "10" },
      { id: "b", text: "9" },
      { id: "c", text: "11" },
      { id: "d", text: "15" }
    ],
    correct_option_id: "a",
    explanation: "5 + 5 = 10."
  },
  {
    id: "q-ma15-1",
    skill_code: "MA15",
    skill_name: "Fatos B\xE1sicos da Subtra\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    statement: "Cl\xE9o tinha 12 feij\xF5es no saco e separou 5 para plantar. Quantos feij\xF5es restaram?",
    options: [
      { id: "a", text: "7 feij\xF5es" },
      { id: "b", text: "6 feij\xF5es" },
      { id: "c", text: "8 feij\xF5es" },
      { id: "d", text: "17 feij\xF5es" }
    ],
    correct_option_id: "a",
    explanation: "12 - 5 = 7 feij\xF5es."
  },
  {
    id: "q-ma15-2",
    skill_code: "MA15",
    skill_name: "Fatos B\xE1sicos da Subtra\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    statement: "Em uma caixa havia 15 ma\xE7\xE3s. Comeram 8. Quantas ma\xE7\xE3s sobraram?",
    options: [
      { id: "a", text: "7" },
      { id: "b", text: "6" },
      { id: "c", text: "9" },
      { id: "d", text: "8" }
    ],
    correct_option_id: "a",
    explanation: "15 - 8 = 7 ma\xE7\xE3s."
  },
  {
    id: "q-ma26-1",
    skill_code: "MA26",
    skill_name: "Fatos B\xE1sicos da Multiplica\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    statement: "Tr\xEAs amigos compraram 4 figurinhas cada um. Quantas figurinhas eles t\xEAm no total?",
    options: [
      { id: "a", text: "12 figurinhas" },
      { id: "b", text: "7 figurinhas" },
      { id: "c", text: "10 figurinhas" },
      { id: "d", text: "15 figurinhas" }
    ],
    correct_option_id: "a",
    explanation: "3 x 4 = 12 figurinhas."
  },
  {
    id: "q-ma26-2",
    skill_code: "MA26",
    skill_name: "Fatos B\xE1sicos da Multiplica\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    statement: "Quanto \xE9 5 x 6?",
    options: [
      { id: "a", text: "30" },
      { id: "b", text: "25" },
      { id: "c", text: "35" },
      { id: "d", text: "11" }
    ],
    correct_option_id: "a",
    explanation: "5 x 6 = 30."
  }
];

// src/data/ativaMatrix.ts
var ATIVA_COMPETENCY_TREE = [
  // ========================== LEITURA (L) ==========================
  {
    code: "L1",
    name: "Discrimina\xE7\xE3o Fonol\xF3gica Inicial",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Discrimina sons das letras no in\xEDcio de uma s\xEDlaba (ex.: PA x BA; TI x DI, etc.).",
    objective: "Consci\xEAncia fon\xEAmica de contraste consonantal.",
    cognitiveAxis: "Consci\xEAncia Fonol\xF3gica",
    isEssential: true
  },
  {
    code: "L2",
    name: "Discrimina\xE7\xE3o de Rimas Finais",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Discrimina sons semelhantes no final da palavra (rimas como: p\xE3o - ch\xE3o e fim - sim).",
    objective: "Reconhecimento auditivo e pareamento de rimas po\xE9ticas.",
    cognitiveAxis: "Consci\xEAncia Fonol\xF3gica",
    isEssential: true
  },
  {
    code: "L3",
    name: "Reconhecimento de Letras do Alfabeto",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece as letras do alfabeto: discrimina letras a partir de outras representa\xE7\xF5es gr\xE1ficas (desenhos, numerais).",
    objective: "Diferencia\xE7\xE3o visual de signos alfab\xE9ticos.",
    cognitiveAxis: "Princ\xEDpio Alfab\xE9tico",
    isEssential: true
  },
  {
    code: "L4",
    name: "Reconhecimento das Letras do Pr\xF3prio Nome",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece as letras do alfabeto: discrimina as letras do seu pr\xF3prio nome.",
    objective: "Identidade e fun\xE7\xE3o social do nome.",
    cognitiveAxis: "Princ\xEDpio Alfab\xE9tico"
  },
  {
    code: "L5",
    name: "Identifica\xE7\xE3o de Vogais",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece as letras do alfabeto: identifica vogais (A - E - I - O - U).",
    objective: "N\xFAcleo sil\xE1bico da l\xEDngua portuguesa.",
    cognitiveAxis: "Grafema-Fonema",
    isEssential: true
  },
  {
    code: "L6",
    name: "Consoantes Frequentes I",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece as consoantes mais frequentes (M, N, P, B, T, D, L).",
    objective: "Reconhecimento r\xE1pido de consoantes oclusivas e nasais.",
    cognitiveAxis: "Grafema-Fonema",
    isEssential: true
  },
  {
    code: "L7",
    name: "Consoantes Frequentes II",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece as consoantes frequentes (C, Q, G, F, V, R, S, Z).",
    objective: "Reconhecimento de fricativas e velares.",
    cognitiveAxis: "Grafema-Fonema",
    isEssential: true
  },
  {
    code: "L9",
    name: "Rela\xE7\xE3o Grafema/Fonema: Vogais",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Associa as letras do alfabeto aos seus respectivos sons: vogais (A - E - I - O - U).",
    objective: "Vocaliza\xE7\xE3o correta dos sons voc\xE1licos.",
    cognitiveAxis: "Decodifica\xE7\xE3o",
    isEssential: true
  },
  {
    code: "L10",
    name: "Rela\xE7\xE3o Grafema/Fonema: Consoantes I",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Associa as letras do alfabeto aos seus respectivos sons: consoantes frequentes (M, N, P, B, T, D, L).",
    objective: "Articula\xE7\xE3o sonora consonantal.",
    cognitiveAxis: "Decodifica\xE7\xE3o",
    isEssential: true
  },
  {
    code: "L13",
    name: "Composi\xE7\xE3o de Palavras por S\xEDlabas Can\xF4nicas",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Comp\xF5e palavras a partir de s\xEDlabas can\xF4nicas: PA, BA, TA, DA, LA.",
    objective: "S\xEDntese sil\xE1bica em palavras diss\xEDlabas.",
    cognitiveAxis: "Flu\xEAncia Leitora",
    isEssential: true
  },
  {
    code: "L26",
    name: "Identifica\xE7\xE3o de Personagem Principal",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Identifica personagem principal de um texto curto e ilustrado.",
    objective: "Compreens\xE3o de narrativa simples.",
    cognitiveAxis: "Compreens\xE3o Leitora",
    isEssential: true
  },
  {
    code: "L27",
    name: "Identifica\xE7\xE3o de Assunto Principal",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Identifica assunto principal de um texto curto e ilustrado.",
    objective: "Ideia central em f\xE1bulas e parlendas.",
    cognitiveAxis: "Compreens\xE3o Leitora",
    isEssential: true
  },
  {
    code: "L34",
    name: "Sin\xF4nimos e Prefixo de Nega\xE7\xE3o",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "2\xBA Ano",
    description: "Identifica e compreende sin\xF4nimos de palavras e reconhece ant\xF4nimos pelo acr\xE9scimo do prefixo in-/im-.",
    objective: "Morfologia lexical b\xE1sica.",
    cognitiveAxis: "Vocabul\xE1rio",
    isEssential: true
  },
  {
    code: "L37",
    name: "Leitura com Autonomia no N\xEDvel Desbravador",
    track: "Leitura",
    level: "Desbravador",
    grade_level: "2\xBA Ano",
    description: "L\xEA textos de DESBRAVADOR - Identifica informa\xE7\xF5es expl\xEDcitas em textos curtos contextualizados (placas, bilhetes, cantigas).",
    objective: "Leitura independente com compreens\xE3o literal.",
    cognitiveAxis: "Flu\xEAncia e Autonomia",
    isEssential: true
  },
  {
    code: "L38",
    name: "Classifica\xE7\xE3o Sil\xE1bica",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Identifica o n\xFAmero de s\xEDlabas das palavras, classificando-as em monoss\xEDlabas, diss\xEDlabas, triss\xEDlabas e poliss\xEDlabas.",
    objective: "Segmenta\xE7\xE3o fonol\xF3gica de palavras complexas.",
    cognitiveAxis: "Morfologia",
    isEssential: true
  },
  {
    code: "L39",
    name: "Classifica\xE7\xE3o da S\xEDlaba T\xF4nica",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Identifica a s\xEDlaba t\xF4nica das palavras e as classifica em ox\xEDtonas, parox\xEDtonas e proparox\xEDtonas.",
    objective: "Pros\xF3dia e acentua\xE7\xE3o gr\xE1fica.",
    cognitiveAxis: "Fonologia e Ortografia",
    isEssential: true
  },
  {
    code: "L41",
    name: "Identifica\xE7\xE3o de Substantivos",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Identifica substantivos em senten\xE7as e compreende suas fun\xE7\xF5es nucleares.",
    objective: "Classes gramaticais funcionais.",
    cognitiveAxis: "Morfossintaxe",
    isEssential: true
  },
  {
    code: "L42",
    name: "Infer\xEAncia de Significado por Contexto",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Relaciona informa\xE7\xF5es do texto para inferir o sentido de uma palavra ou express\xE3o desconhecida.",
    objective: "Infer\xEAncia sem\xE2ntica contextual.",
    cognitiveAxis: "Compreens\xE3o Leitora",
    isEssential: true
  },
  {
    code: "L45",
    name: "Textos Instrucionais e Injuntivos",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "L\xEA e compreende, com autonomia, textos injuntivos instrucionais (receitas, manuais de regras e montagem).",
    objective: "G\xEAneros da vida pr\xE1tica.",
    cognitiveAxis: "G\xEAneros Textuais",
    isEssential: true
  },
  {
    code: "L49",
    name: "Leitura Aut\xF4noma de N\xEDvel Mochileiro",
    track: "Leitura",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "L\xEA e interpreta textos do n\xEDvel MOCHILEIRO - Identifica informa\xE7\xF5es expl\xEDcitas em receitas, cartas e propagandas.",
    objective: "Consolida\xE7\xE3o de leitura aut\xF4noma.",
    cognitiveAxis: "Flu\xEAncia e Compreens\xE3o",
    isEssential: true
  },
  {
    code: "L52",
    name: "Rela\xE7\xF5es Coesivas Impl\xEDcitas",
    track: "Leitura",
    level: "Navegador",
    grade_level: "4\xBA Ano",
    description: "Entende rela\xE7\xF5es dentro de partes delimitadas de um texto quando as informa\xE7\xF5es n\xE3o aparecem em destaque.",
    objective: "Coes\xE3o referencial profunda.",
    cognitiveAxis: "Compreens\xE3o Textual",
    isEssential: true
  },
  {
    code: "L62",
    name: "Distin\xE7\xE3o entre Fato e Opini\xE3o",
    track: "Leitura",
    level: "Navegador",
    grade_level: "4\xBA Ano",
    description: "Distingue com seguran\xE7a um fato objetivo de uma opini\xE3o expressa relativa a esse fato.",
    objective: "Leitura cr\xEDtica para cidadania.",
    cognitiveAxis: "Pensamento Cr\xEDtico",
    isEssential: true
  },
  {
    code: "L66",
    name: "Estrutura Narrativa Ficcionais",
    track: "Leitura",
    level: "Mergulhador",
    grade_level: "5\xBA Ano",
    description: "L\xEA e compreende narrativas ficcionais observando enredo, tempo, espa\xE7o, personagens e discurso direto/indireto.",
    objective: "Aprecia\xE7\xE3o liter\xE1ria estruturada.",
    cognitiveAxis: "Literatura e Narrativa",
    isEssential: true
  },
  {
    code: "L76",
    name: "Compara\xE7\xE3o de Fontes e M\xEDdias",
    track: "Leitura",
    level: "Mergulhador",
    grade_level: "5\xBA Ano",
    description: "Compara informa\xE7\xF5es sobre um mesmo fato veiculadas em diferentes m\xEDdias e avalia confiabilidade.",
    objective: "Letramento midi\xE1tico contra desinforma\xE7\xE3o.",
    cognitiveAxis: "Letramento Midi\xE1tico",
    isEssential: true
  },
  {
    code: "L86",
    name: "An\xE1lise de Textos Argumentativos",
    track: "Leitura",
    level: "Alpinista",
    grade_level: "6\xBA Ano",
    description: "Identifica e avalia teses, opini\xF5es e argumentos em cartas de leitor, artigos de opini\xE3o e resenhas cr\xEDticas.",
    objective: "Reconhecimento da estrutura dissertativa.",
    cognitiveAxis: "Argumenta\xE7\xE3o",
    isEssential: true
  },
  {
    code: "L105",
    name: "Rela\xE7\xF5es L\xF3gico-Discursivas Avan\xE7adas",
    track: "Leitura",
    level: "Aviador",
    grade_level: "7\xBA Ano",
    description: "Estabelece rela\xE7\xF5es l\xF3gico-discursivas: causa/efeito, tese/argumentos, problema/solu\xE7\xE3o em textos n\xE3o familiares.",
    objective: "Interpreta\xE7\xE3o inferencial superior.",
    cognitiveAxis: "L\xF3gica Textual",
    isEssential: true
  },
  {
    code: "L144",
    name: "Interpreta\xE7\xE3o e Intertextualidade Global",
    track: "Leitura",
    level: "Astronauta",
    grade_level: "9\xBA Ano",
    description: "L\xEA e interpreta textos complexos (not\xEDcias, ensaios, poesias), aplicando intertextualidade e avaliando argumentos.",
    objective: "Pleno dom\xEDnio cr\xEDtico da l\xEDngua.",
    cognitiveAxis: "Intertextualidade e Cr\xEDtica",
    isEssential: true
  },
  // ========================== MATEMÁTICA (MA / MB / MC) ==========================
  {
    code: "MA1",
    name: "N\xFAmeros no Cotidiano",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Reconhece os n\xFAmeros e seus usos frequentes no cotidiano (contagem, c\xF3digo, ordem e medida).",
    objective: "Sentido num\xE9rico e utilidade social do n\xFAmero.",
    cognitiveAxis: "N\xFAmeros e \xC1lgebra",
    isEssential: true
  },
  {
    code: "MA2",
    name: "Compara\xE7\xE3o de Quantidades (Subitizing)",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Compara quantidades at\xE9 10, sem contar (estimativa perceptiva visual).",
    objective: "Percep\xE7\xE3o de magnitude num\xE9rica.",
    cognitiveAxis: "N\xFAmeros e \xC1lgebra",
    isEssential: true
  },
  {
    code: "MA3",
    name: "Contagem e Reta Num\xE9rica at\xE9 10",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Conta, representa e grafa n\xFAmeros at\xE9 10 na reta num\xE9rica e os relaciona \xE0 sua respectiva quantidade.",
    objective: "Correspond\xEAncia biun\xEDvoca e cardinalidade.",
    cognitiveAxis: "N\xFAmeros e \xC1lgebra",
    isEssential: true
  },
  {
    code: "MA7",
    name: "Reta Num\xE9rica at\xE9 100",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Conta, representa e grafa n\xFAmeros naturais at\xE9 100 na reta num\xE9rica.",
    objective: "Sequ\xEAncia num\xE9rica e ordena\xE7\xE3o.",
    cognitiveAxis: "N\xFAmeros e \xC1lgebra",
    isEssential: true
  },
  {
    code: "MA9",
    name: "Fatos B\xE1sicos da Adi\xE7\xE3o Concreta",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Utiliza fatos b\xE1sicos da adi\xE7\xE3o com o aux\xEDlio de material manipul\xE1vel concreto.",
    objective: "Conceito de juntar e acrescentar.",
    cognitiveAxis: "Opera\xE7\xF5es Fundamentais",
    isEssential: true
  },
  {
    code: "MA11",
    name: "Valor Posicional e Fun\xE7\xE3o do Zero",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "2\xBA Ano",
    description: "Compreende o valor posicional de unidades e dezenas e a fun\xE7\xE3o do zero no sistema decimal.",
    objective: "Base decimal e reagrupamento.",
    cognitiveAxis: "Sistema Decimal",
    isEssential: true
  },
  {
    code: "MA15",
    name: "Fatos B\xE1sicos da Subtra\xE7\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    grade_level: "2\xBA / 3\xBA Ano",
    description: "Utiliza os fatos b\xE1sicos da subtra\xE7\xE3o (conceito de tirar, comparar e completar diferen\xE7as).",
    objective: "Racioc\xEDnio subtrativo com e sem suporte concreto.",
    cognitiveAxis: "Opera\xE7\xF5es Fundamentais",
    isEssential: true
  },
  {
    code: "MA19",
    name: "Algoritmo da Adi\xE7\xE3o e Subtra\xE7\xE3o com Reserva",
    track: "Matem\xE1tica",
    level: "Desbravador",
    grade_level: "2\xBA Ano",
    description: "Aplica o algoritmo da adi\xE7\xE3o e da subtra\xE7\xE3o com reserva em n\xFAmeros naturais de at\xE9 duas ordens.",
    objective: "T\xE9cnica operat\xF3ria formal com reagrupamento.",
    cognitiveAxis: "Opera\xE7\xF5es Fundamentais",
    isEssential: true
  },
  {
    code: "MA23",
    name: "N\xFAmeros at\xE9 1.000",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Compara, grafa e ordena n\xFAmeros naturais at\xE9 1.000 na reta num\xE9rica e escreve por extenso.",
    objective: "Compreens\xE3o da centena e milhar.",
    cognitiveAxis: "N\xFAmeros e \xC1lgebra",
    isEssential: true
  },
  {
    code: "MA26",
    name: "Fatos B\xE1sicos da Multiplica\xE7\xE3o (Tabuada)",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Utiliza os fatos b\xE1sicos da multiplica\xE7\xE3o construindo as rela\xE7\xF5es da tabuada.",
    objective: "Adi\xE7\xE3o de parcelas iguais e matriz retangular.",
    cognitiveAxis: "Multiplica\xE7\xE3o e Divis\xE3o",
    isEssential: true
  },
  {
    code: "MA30",
    name: "Fatos B\xE1sicos da Divis\xE3o",
    track: "Matem\xE1tica",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Utiliza os fatos b\xE1sicos da divis\xE3o compreendendo parti\xE7\xE3o equitativa e medida.",
    objective: "Distribui\xE7\xE3o igualit\xE1ria e verifica\xE7\xE3o.",
    cognitiveAxis: "Multiplica\xE7\xE3o e Divis\xE3o",
    isEssential: true
  },
  {
    code: "MA34",
    name: "Algoritmo da Divis\xE3o por Uma Ordem",
    track: "Matem\xE1tica",
    level: "Navegador",
    grade_level: "4\xBA Ano",
    description: "Aplica o algoritmo formal da divis\xE3o com divisor natural de uma ordem.",
    objective: "C\xE1lculo de quociente e resto com exatid\xE3o.",
    cognitiveAxis: "Multiplica\xE7\xE3o e Divis\xE3o",
    isEssential: true
  },
  {
    code: "MA44",
    name: "Representa\xE7\xE3o de N\xFAmeros Fracion\xE1rios",
    track: "Matem\xE1tica",
    level: "Mergulhador",
    grade_level: "5\xBA Ano",
    description: "Identifica, compreende e representa n\xFAmeros fracion\xE1rios a partir de rela\xE7\xF5es parte-todo.",
    objective: "Sentido fracion\xE1rio e fra\xE7\xE3o como operador.",
    cognitiveAxis: "N\xFAmeros Racionais",
    isEssential: true
  },
  {
    code: "MA53",
    name: "Opera\xE7\xF5es com N\xFAmeros Decimais",
    track: "Matem\xE1tica",
    level: "Alpinista",
    grade_level: "6\xBA Ano",
    description: "Resolve as quatro opera\xE7\xF5es fundamentais com n\xFAmeros decimais no sistema monet\xE1rio e medidas.",
    objective: "C\xE1lculo com casas decimais e alinhamento de v\xEDrgula.",
    cognitiveAxis: "N\xFAmeros Racionais",
    isEssential: true
  },
  {
    code: "MA71",
    name: "Proporcionalidade e Regra de Tr\xEAs",
    track: "Matem\xE1tica",
    level: "Aviador",
    grade_level: "7\xBA Ano",
    description: "Compreende e aplica o conceito de raz\xE3o, propor\xE7\xE3o e a regra de tr\xEAs simples em situa\xE7\xF5es pr\xE1ticas.",
    objective: "Racioc\xEDnio proporcional multiplicativo.",
    cognitiveAxis: "\xC1lgebra e Fun\xE7\xF5es",
    isEssential: true
  },
  {
    code: "MA92",
    name: "Equa\xE7\xF5es de 2\xBA Grau e Bh\xE1skara",
    track: "Matem\xE1tica",
    level: "Astronauta",
    grade_level: "9\xBA Ano",
    description: "Identifica e compreende equa\xE7\xF5es completas e incompletas do 2\xBA grau, aplicando a f\xF3rmula de Bh\xE1skara.",
    objective: "Resolu\xE7\xE3o anal\xEDtica de equa\xE7\xF5es quadr\xE1ticas.",
    cognitiveAxis: "\xC1lgebra Superior",
    isEssential: true
  },
  // ========================== REDAÇÃO / ESCRITA (E) ==========================
  {
    code: "E1",
    name: "Preens\xE3o e Tra\xE7ado Motor do L\xE1pis",
    track: "Reda\xE7\xE3o",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Segura o l\xE1pis com preens\xE3o apropriada e faz press\xE3o adequada sobre o papel (letras bast\xE3o).",
    objective: "Coordena\xE7\xE3o psicomotora e tra\xE7ado leg\xEDvel.",
    cognitiveAxis: "Grafomotricidade"
  },
  {
    code: "E5",
    name: "Escrita com Correspond\xEAncia Sonora Direta",
    track: "Reda\xE7\xE3o",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Escreve palavras usando correspond\xEAncia direta entre letra e som (hip\xF3tese alfab\xE9tica inicial).",
    objective: "Registro alfab\xE9tico aut\xF4nomo.",
    cognitiveAxis: "Aquisi\xE7\xE3o da Escrita"
  },
  {
    code: "E18",
    name: "Ditado de Palavras com Regularidades",
    track: "Reda\xE7\xE3o",
    level: "Desbravador",
    grade_level: "1\xBA Ano",
    description: "Realiza ditado de palavras com correspond\xEAncia regular direta e contextual (C/QU, G/GU, R/RR, M/N antes de P/B).",
    objective: "Ortografia inicial estruturada.",
    cognitiveAxis: "Ortografia"
  },
  {
    code: "E23",
    name: "Senten\xE7as com Sujeito e Verbo",
    track: "Reda\xE7\xE3o",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Escreve senten\xE7as completas com sujeito e verbo, aplicando concord\xE2ncia e pontua\xE7\xE3o terminal.",
    objective: "Constru\xE7\xE3o da frase can\xF4nica.",
    cognitiveAxis: "Estrutura\xE7\xE3o Sint\xE1tica"
  },
  {
    code: "E34",
    name: "Estrutura Narrativa: In\xEDcio, Meio e Fim",
    track: "Reda\xE7\xE3o",
    level: "Navegador",
    grade_level: "4\xBA Ano",
    description: "Produz texto aplicando com clareza a estrutura de uma narrativa com come\xE7o, cl\xEDmax e desfecho.",
    objective: "Progress\xE3o temporal e encadeamento de eventos.",
    cognitiveAxis: "G\xEAneros Liter\xE1rios"
  },
  {
    code: "E55",
    name: "Texto Argumentativo com Opini\xE3o Fundamentada",
    track: "Reda\xE7\xE3o",
    level: "Alpinista",
    grade_level: "6\xBA Ano",
    description: "Produz textos argumentativos expressando ideias e opini\xF5es com recursos lingu\xEDsticos de persuas\xE3o.",
    objective: "Defesa de ponto de vista com justificativas.",
    cognitiveAxis: "Disserta\xE7\xE3o e Argumenta\xE7\xE3o"
  },
  {
    code: "E72",
    name: "Produ\xE7\xE3o Multimodal de N\xEDvel Astronauta",
    track: "Reda\xE7\xE3o",
    level: "Astronauta",
    grade_level: "9\xBA Ano",
    description: "Produz textos de n\xEDvel ASTRONAUTA integrando diferentes tipos textuais, recursos multimidi\xE1ticos e adequa\xE7\xE3o formal.",
    objective: "Comunica\xE7\xE3o complexa, autoral e cidad\xE3.",
    cognitiveAxis: "Autoria Avan\xE7ada"
  },
  // ========================== INGLÊS (IL / IR / IS / IW) ==========================
  {
    code: "IL2",
    name: "Reconhecimento de Palavras em Ingl\xEAs",
    track: "Ingl\xEAs",
    level: "Desbravador",
    grade_level: "1\xBA e 2\xBA Ano",
    description: "Reconhece palavras como pertencentes \xE0 l\xEDngua inglesa quando as escuta no ambiente.",
    objective: "Identifica\xE7\xE3o perceptual de sonoridade em l\xEDngua estrangeira.",
    cognitiveAxis: "Recep\xE7\xE3o Auditiva",
    isEssential: true
  },
  {
    code: "IL3",
    name: "Cumprimentos em Ingl\xEAs",
    track: "Ingl\xEAs",
    level: "Desbravador",
    grade_level: "1\xBA e 2\xBA Ano",
    description: "Identifica cumprimentos cotidianos em ingl\xEAs (Hello, Good morning, Bye) ao escut\xE1-los.",
    objective: "Sauda\xE7\xF5es sociais e f\xF3rmulas de cortesia.",
    cognitiveAxis: "Comunica\xE7\xE3o Interpessoal",
    isEssential: true
  },
  {
    code: "IR10",
    name: "Compreens\xE3o de Adjetivos B\xE1sicos",
    track: "Ingl\xEAs",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Compreende adjetivos descritivos comuns (big, small, hot, happy) em ora\xE7\xF5es simples em ingl\xEAs.",
    objective: "Expans\xE3o de vocabul\xE1rio descritivo.",
    cognitiveAxis: "Vocabul\xE1rio e Sintaxe",
    isEssential: true
  },
  {
    code: "IS8",
    name: "Apresenta\xE7\xE3o Pessoal em Ingl\xEAs",
    track: "Ingl\xEAs",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Consegue se apresentar oralmente e fornecer dados pessoais elementares (nome, idade, prefer\xEAncias).",
    objective: "Express\xE3o oral aut\xEAntica em ingl\xEAs.",
    cognitiveAxis: "Flu\xEAncia Oral"
  },
  // ========================== DESCOBERTA (CIÊNCIAS) ==========================
  {
    code: "D1",
    name: "Observa\xE7\xE3o do Ambiente e Seres Vivos",
    track: "Descoberta",
    level: "Desbravador",
    grade_level: "1\xBA e 2\xBA Ano",
    description: "Identifica caracter\xEDsticas dos seres vivos e dos elementos n\xE3o vivos do ambiente imediato.",
    objective: "Consci\xEAncia ecol\xF3gica e observa\xE7\xE3o atenta.",
    cognitiveAxis: "Ecologia e Investiga\xE7\xE3o",
    isEssential: true
  },
  {
    code: "D6",
    name: "Ciclo da \xC1gua e Estados F\xEDsicos",
    track: "Descoberta",
    level: "Mochileiro",
    grade_level: "3\xBA Ano",
    description: "Compreende o ciclo hidrol\xF3gico e identifica os estados f\xEDsicos da mat\xE9ria em experimentos pr\xE1ticos.",
    objective: "Transforma\xE7\xF5es da mat\xE9ria e recursos h\xEDdricos.",
    cognitiveAxis: "F\xEDsica e Clima",
    isEssential: true
  },
  {
    code: "D15",
    name: "Corpo Humano e H\xE1bitos Saud\xE1veis",
    track: "Descoberta",
    level: "Navegador",
    grade_level: "4\xBA e 5\xBA Ano",
    description: "Reconhece o funcionamento integrado dos sistemas digest\xF3rio e respirat\xF3rio e a import\xE2ncia da nutri\xE7\xE3o.",
    objective: "Promo\xE7\xE3o da sa\xFAde e autocuidado.",
    cognitiveAxis: "Biologia Humana",
    isEssential: true
  },
  // ========================== HABILIDADES PARA A VIDA (H) ==========================
  {
    code: "H1",
    name: "Controle de Aten\xE7\xE3o e Foco na Tarefa",
    track: "Habilidades para a Vida",
    level: "Desbravador",
    grade_level: "Multisseriado",
    description: "\xC9 capaz de manter a aten\xE7\xE3o sustentada numa tarefa de sala de aula at\xE9 finaliz\xE1-la.",
    objective: "Fun\xE7\xE3o executiva de foco e persist\xEAncia.",
    cognitiveAxis: "Pensar (Cogni\xE7\xE3o)",
    isEssential: true
  },
  {
    code: "H2",
    name: "Controle Inibit\xF3rio de Impulsos",
    track: "Habilidades para a Vida",
    level: "Desbravador",
    grade_level: "Multisseriado",
    description: "\xC9 capaz de inibir comportamentos impulsivos, aguardar a vez de falar e seguir combinados.",
    objective: "Autorregula\xE7\xE3o da conduta em grupo.",
    cognitiveAxis: "Pensar (Cogni\xE7\xE3o)",
    isEssential: true
  },
  {
    code: "H6",
    name: "Nomea\xE7\xE3o de Emo\xE7\xF5es Pr\xF3prias",
    track: "Habilidades para a Vida",
    level: "Desbravador",
    grade_level: "Multisseriado",
    description: "Consegue reconhecer e nomear emo\xE7\xF5es que sente (alegria, medo, raiva, tristeza, ansiedade).",
    objective: "Alfabetiza\xE7\xE3o emocional e consci\xEAncia de si.",
    cognitiveAxis: "Sentir (Emo\xE7\xE3o)",
    isEssential: true
  },
  {
    code: "H7",
    name: "Empatia e Percep\xE7\xE3o do Outro",
    track: "Habilidades para a Vida",
    level: "Mochileiro",
    grade_level: "Multisseriado",
    description: "Consegue reconhecer e nomear as emo\xE7\xF5es que os colegas e adultos est\xE3o demonstrando sentir.",
    objective: "Desenvolvimento da perspectiva e empatia ativa.",
    cognitiveAxis: "Sentir (Emo\xE7\xE3o)",
    isEssential: true
  },
  {
    code: "H11",
    name: "Explora\xE7\xE3o de Pontos Fortes e Metas",
    track: "Habilidades para a Vida",
    level: "Navegador",
    grade_level: "Multisseriado",
    description: "Conhece e explora seus pontos fortes e consegue tra\xE7ar estrat\xE9gias para superar suas limita\xE7\xF5es.",
    objective: "Autoefic\xE1cia e plano de crescimento pessoal.",
    cognitiveAxis: "Autoconhecimento",
    isEssential: true
  },
  {
    code: "H14",
    name: "Persist\xEAncia Diante de Desafios Dif\xEDceis",
    track: "Habilidades para a Vida",
    level: "Mergulhador",
    grade_level: "Multisseriado",
    description: "Demonstra a habilidade de persistir em tarefas dif\xEDceis sem desistir precocemente.",
    objective: "Resili\xEAncia e mentalidade de crescimento.",
    cognitiveAxis: "Autoconhecimento",
    isEssential: true
  },
  {
    code: "H16",
    name: "A\xE7\xE3o Pr\xF3-Social e Ajuda M\xFAtua",
    track: "Habilidades para a Vida",
    level: "Alpinista",
    grade_level: "Multisseriado",
    description: "Consegue perceber indicativos de como os outros est\xE3o se sentindo e atua ativamente para ajudar.",
    objective: "Cidadania colaborativa e solidariedade.",
    cognitiveAxis: "Contribuir & Retribuir",
    isEssential: true
  },
  {
    code: "H21",
    name: "Resolu\xE7\xE3o Positiva de Conflitos",
    track: "Habilidades para a Vida",
    level: "Astronauta",
    grade_level: "Multisseriado",
    description: "Identifica e pratica comportamentos adequados de escuta e media\xE7\xE3o que resultam em resolu\xE7\xE3o pac\xEDfica de conflitos.",
    objective: "Cultura de paz e media\xE7\xE3o entre pares.",
    cognitiveAxis: "Autossupera\xE7\xE3o",
    isEssential: true
  }
];

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "15mb" }));
var dbUsers = [...SEED_USERS];
var dbClasses = [...SEED_CLASSES];
var dbStudents = [...SEED_STUDENTS];
var dbActivities = [...SEED_ACTIVITIES];
var dbAssessments = [...SEED_ASSESSMENTS];
var dbResults = [...SEED_RESULTS];
var dbAttendance = [...SEED_ATTENDANCE];
var dbPortfolio = [...SEED_PORTFOLIO];
var dbAdaptiveSessions = {};
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "ATIVA - API REST Educacional (ODS 4 & ZDP Vygotsky)",
    version: "2.0.0",
    description: "API REST da Plataforma ATIVA para Gest\xE3o de Turmas, Chamada Escolar, Avalia\xE7\xE3o Formativa Adaptativa MAPA e Planejamento ZDP alinhado \xE0 BNCC e ao ODS 4 (Educa\xE7\xE3o de Qualidade)."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local de Desenvolvimento"
    }
  ],
  components: {
    securitySchemes: {
      TeacherAuth: {
        type: "apiKey",
        in: "header",
        name: "x-teacher-id",
        description: "ID do professor logado para isolamento Multi-tenancy."
      }
    }
  },
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Autentica\xE7\xE3o de Usu\xE1rio (RBAC)",
        description: "Autentica Diretor, Coordenador, Professor ou Aluno.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "carlos@ativa.edu.br" },
                  password: { type: "string", example: "password123" },
                  role: { type: "string", example: "PROFESSOR" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Usu\xE1rio autenticado com sucesso." }
        }
      }
    },
    "/api/classes": {
      get: {
        summary: "Lista turmas do professor logado (Multi-tenancy)",
        responses: { 200: { description: "Lista de turmas vinculadas." } }
      },
      post: {
        summary: "Cria\xE7\xE3o de nova turma escolar",
        responses: { 201: { description: "Turma criada com sucesso." } }
      }
    },
    "/api/students": {
      get: {
        summary: "Lista estudantes de uma turma com seus n\xEDveis e compet\xEAncias",
        parameters: [
          {
            name: "class_id",
            in: "query",
            required: false,
            schema: { type: "string" }
          }
        ],
        responses: { 200: { description: "Lista de alunos com profici\xEAncias." } }
      }
    },
    "/api/attendance": {
      get: {
        summary: "Consulta registros de chamada e frequ\xEAncia escolar",
        parameters: [
          { name: "class_id", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "Hist\xF3rico de assiduidade." } }
      },
      post: {
        summary: "Registra frequ\xEAncia di\xE1ria dos estudantes na turma",
        responses: { 200: { description: "Chamada registrada com sucesso." } }
      }
    },
    "/api/mapa-assessments": {
      post: {
        summary: "Agenda ou aplica uma avalia\xE7\xE3o formativa MAPA",
        responses: { 201: { description: "MAPA criado/agendado." } }
      }
    },
    "/api/mapa-results": {
      post: {
        summary: "Registra notas e atualiza automaticamente profici\xEAncias e n\xEDvel do aluno",
        responses: { 200: { description: "Resultados salvos e n\xEDvel atualizado." } }
      }
    },
    "/api/planner/recommend": {
      get: {
        summary: "Recomenda atividades baseadas na Zona de Desenvolvimento Proximal (ZDP)",
        parameters: [
          { name: "students", in: "query", required: true, schema: { type: "string" } },
          { name: "skill", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: { 200: { description: "Plano com 4 momentos e media\xE7\xE3o." } }
      }
    }
  }
};
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.post("/api/auth/login", (req, res) => {
  const { email, role } = req.body;
  let user;
  if (role) {
    user = dbUsers.find((u) => u.role === role);
  } else if (email) {
    user = dbUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  if (!user) {
    user = dbUsers[2];
  }
  const token = `jwt-token-${user.id}-${Date.now()}`;
  res.json({ token, user });
});
app.get("/api/users", (_req, res) => {
  res.json(dbUsers);
});
app.get("/api/classes", (req, res) => {
  const teacherId = req.query.teacher_id || req.header("x-teacher-id");
  if (teacherId && teacherId !== "user-diretor" && teacherId !== "user-coord") {
    const filtered = dbClasses.filter((c) => c.teacher_id === teacherId);
    return res.json(filtered.length > 0 ? filtered : dbClasses);
  }
  res.json(dbClasses);
});
app.post("/api/classes", (req, res) => {
  const { name, grade_level, shift } = req.body;
  const teacherId = req.header("x-teacher-id") || "teacher-1";
  const newClass = {
    id: `class-${Date.now()}`,
    name: name || "Nova Turma ATIVA",
    teacher_id: teacherId,
    grade_level: grade_level || "1\xBA e 2\xBA Ano (Fundamental I)",
    shift: shift || "Matutino",
    academic_year: 2026
  };
  dbClasses.push(newClass);
  res.status(201).json(newClass);
});
app.get("/api/students", (req, res) => {
  const classId = req.query.class_id;
  if (classId) {
    return res.json(dbStudents.filter((s) => s.class_id === classId));
  }
  res.json(dbStudents);
});
app.post("/api/students", (req, res) => {
  const { name, class_id, current_level, registration_number, birth_date, age } = req.body;
  const newStudent = {
    id: `std-${Date.now()}`,
    name: name || "Novo Estudante",
    class_id: class_id || dbClasses[0].id,
    current_level: current_level || "Desbravador",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    registration_number: registration_number || `2026-${Math.floor(100 + Math.random() * 900)}`,
    birth_date: birth_date || "2018-05-10",
    age: age || 8,
    last_assessment_score: 80,
    mastered_skills: ["L1", "MA1"]
  };
  dbStudents.push(newStudent);
  res.status(201).json(newStudent);
});
app.get("/api/attendance", (req, res) => {
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
app.post("/api/attendance", (req, res) => {
  const { class_id, date, present_student_ids, notes } = req.body;
  const teacherId = req.header("x-teacher-id") || "teacher-1";
  const existingIdx = dbAttendance.findIndex(
    (r) => r.class_id === class_id && r.date === date
  );
  const record = {
    id: existingIdx >= 0 ? dbAttendance[existingIdx].id : `att-${Date.now()}`,
    class_id,
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    present_student_ids: present_student_ids || [],
    notes: notes || "",
    recorded_by: teacherId
  };
  if (existingIdx >= 0) {
    dbAttendance[existingIdx] = record;
  } else {
    dbAttendance.unshift(record);
  }
  res.json(record);
});
app.get("/api/portfolio", (req, res) => {
  const studentId = req.query.student_id;
  let items = dbPortfolio.map((item) => {
    const student = dbStudents.find((s) => s.id === item.student_id);
    const teacher = dbUsers.find((u) => u.id === (item.teacher?.id || "teacher-1"));
    return {
      ...item,
      student,
      teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar } : void 0
    };
  });
  if (studentId) {
    items = items.filter((it) => it.student_id === studentId);
  }
  res.json(items);
});
app.post("/api/portfolio", (req, res) => {
  const { student_id, title, description, pedagogical_opinion, media_url, media_type, tags } = req.body;
  const teacherId = req.header("x-teacher-id") || "teacher-1";
  const teacher = dbUsers.find((u) => u.id === teacherId);
  const student = dbStudents.find((s) => s.id === student_id);
  const newItem = {
    id: `port-${Date.now()}`,
    student_id,
    student,
    title: title || "Registro de Atividade Pr\xE1tica",
    description: description || "",
    pedagogical_opinion: pedagogical_opinion || "O estudante demonstrou evolu\xE7\xE3o satisfat\xF3ria na atividade e autonomia na resolu\xE7\xE3o do desafio.",
    media_url: media_url || "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=700&auto=format&fit=crop&q=80",
    media_type: media_type || "image",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    teacher: teacher ? { id: teacher.id, name: teacher.name, avatar: teacher.avatar } : void 0,
    tags: tags || ["Atividade Pr\xE1tica", "ZDP"]
  };
  dbPortfolio.unshift(newItem);
  res.status(201).json(newItem);
});
app.get("/api/mapa-assessments", (req, res) => {
  const classId = req.query.class_id;
  if (classId) {
    return res.json(dbAssessments.filter((a) => a.class_id === classId));
  }
  res.json(dbAssessments);
});
app.post("/api/mapa-assessments", (req, res) => {
  const { title, class_id, target_type, target_ids, track, skill_codes, notes } = req.body;
  const teacherId = req.header("x-teacher-id") || "teacher-1";
  const newAssessment = {
    id: `mapa-${Date.now()}`,
    title: title || "Avalia\xE7\xE3o MAPA Adaptativo",
    class_id,
    teacher_id: teacherId,
    target_type: target_type || "class",
    target_ids: target_ids || [],
    track: track || "Leitura",
    skill_codes: skill_codes || ["L1", "L2"],
    status: "Agendado",
    scheduled_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    notes: notes || ""
  };
  dbAssessments.unshift(newAssessment);
  res.status(201).json(newAssessment);
});
app.post("/api/mapa-results", (req, res) => {
  const { assessment_id, student_id, score, mastered_skills, teacher_notes } = req.body;
  const studentIdx = dbStudents.findIndex((s) => s.id === student_id);
  if (studentIdx === -1) {
    return res.status(404).json({ error: "Estudante n\xE3o encontrado." });
  }
  const currentStudent = dbStudents[studentIdx];
  const previousLevel = currentStudent.current_level;
  const updatedMastered = Array.from(
    /* @__PURE__ */ new Set([...currentStudent.mastered_skills || [], ...mastered_skills || []])
  );
  let newLevel = previousLevel;
  if (updatedMastered.length >= 10 && previousLevel === "Desbravador") {
    newLevel = "Mochileiro";
  } else if (updatedMastered.length >= 14 && previousLevel === "Mochileiro") {
    newLevel = "Navegador";
  } else if (updatedMastered.length >= 18 && previousLevel === "Navegador") {
    newLevel = "Mergulhador";
  }
  const newResult = {
    id: `res-${Date.now()}`,
    assessment_id,
    student_id,
    score: typeof score === "number" ? score : 85,
    mastered_skills: mastered_skills || [],
    previous_level: previousLevel,
    new_recommended_level: newLevel,
    teacher_notes: teacher_notes || "Demonstrou prontid\xE3o e avan\xE7o consistente.",
    evaluation_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
  dbResults.unshift(newResult);
  dbStudents[studentIdx] = {
    ...currentStudent,
    mastered_skills: updatedMastered,
    current_level: newLevel,
    last_assessment_score: newResult.score
  };
  res.json({ result: newResult, student: dbStudents[studentIdx] });
});
app.get("/api/mapa-results", (req, res) => {
  const studentId = req.query.student_id;
  if (studentId) {
    return res.json(dbResults.filter((r) => r.student_id === studentId));
  }
  res.json(dbResults);
});
app.get("/api/planner/recommend", (req, res) => {
  const studentsParam = req.query.students;
  const skillCode = req.query.skill || "L2";
  const studentIds = studentsParam ? studentsParam.split(",") : [];
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
      differentiationTip: hasMastered ? `${std.name} j\xE1 domina a habilidade ${skillCode}. Oriente-o a atuar como monitor parceiro do colega.` : `${std.name} est\xE1 em fase de ZDP ativa. Forne\xE7a suporte de media\xE7\xE3o e materiais concretos manipulativos.`
    };
  });
  res.json({
    activity: matchedActivity,
    recommended_activity: matchedActivity,
    studentsAnalyzed,
    vysgotskySummary: {
      actualDevelopmentLevel: "N\xEDvel Real: Resolu\xE7\xE3o com apoio e decodifica\xE7\xE3o estruturada.",
      proximalTargetLevel: `Zona de Desenvolvimento Proximal (ZDP): Consolida\xE7\xE3o da compet\xEAncia ${skillCode}.`,
      scaffoldingAdvice: "Trabalhar com duplas produtivas heterog\xEAneas e alternar momentos de explora\xE7\xE3o concreta com s\xEDntese reflexiva."
    }
  });
});
app.post("/api/planner/generate-ai", async (req, res) => {
  try {
    const { prompt, skill_code, target_students } = req.body;
    const competency = ATIVA_COMPETENCY_TREE.find((c) => c.code === skill_code) || ATIVA_COMPETENCY_TREE[1];
    const systemInstruction = `Voc\xEA \xE9 o Assistente Pedag\xF3gico S\xEAnior da Plataforma ATIVA, fundamentado na Teoria Hist\xF3rico-Cultural de Lev Vygotsky, na BNCC e no ODS 4 da ONU (Educa\xE7\xE3o de Qualidade).
Sua miss\xE3o \xE9 gerar um plano de aula pr\xE1tico, estruturado estritamente nos 4 Momentos da Metodologia ATIVA:
1. Prepara\xE7\xE3o (espa\xE7o e materiais)
2. Primeiro Momento (10-15 min: acolhimento, engajamento e desafio disparador)
3. Segundo Momento (30 min: laborat\xF3rio pr\xE1tico com materiais manipulativos em duplas/grupos)
4. Revis\xE3o/Sistematiza\xE7\xE3o (15 min: consolida\xE7\xE3o, reflex\xE3o e registro formativo)
Al\xE9m disso, forne\xE7a estrat\xE9gias claras de Diferencia\xE7\xE3o de Instru\xE7\xE3o (Apoio / Scaffolding para quem ainda n\xE3o domina e Desafio para quem j\xE1 domina).
Responda EXCLUSIVAMENTE em formato JSON compat\xEDvel com o schema de Activity.`;
    const userPrompt = `Gere uma atividade inovadora para a compet\xEAncia ${competency.code}: "${competency.name}" (${competency.description}).
N\xEDvel: ${competency.level}. Trilha: ${competency.track}.
Instru\xE7\xF5es adicionais do professor: ${prompt || "Atividade l\xFAdica e cooperativa com foco em inclus\xE3o"}.`;
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });
      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      const createdActivity = {
        id: `act-ai-${Date.now()}`,
        skill_code: competency.code,
        target_skill_code: competency.code,
        skill_name: competency.name,
        description: parsed.description || competency.description,
        activity_name: parsed.activity_name || `Oficina Pr\xE1tica de ${competency.name}`,
        title: parsed.activity_name || `Oficina Pr\xE1tica de ${competency.name}`,
        track: competency.track,
        required_level: competency.level,
        duration_minutes: parsed.duration_minutes || 45,
        age_group: parsed.age_group || "7 a 9 anos",
        suggested_group_size: parsed.suggested_group_size || "Duplas colaborativas",
        materials: parsed.materials || ["Papel sulfite", "Cart\xF5es ilustrados", "L\xE1pis colorido"],
        character_mascot: "Guima",
        created_by_ai: true,
        full_guide: {
          preparation: parsed.full_guide?.preparation || "Preparar materiais e organizar as mesas em ilhas.",
          first_moment: parsed.full_guide?.first_moment || "Apresentar a hist\xF3ria disparadora e conectar com a vida di\xE1ria dos alunos.",
          second_moment: parsed.full_guide?.second_moment || "Pr\xE1tica colaborativa em duplas com media\xE7\xE3o do professor.",
          review: parsed.full_guide?.review || "Roda de partilha e s\xEDntese coletiva no quadro."
        },
        differentiation: {
          support: parsed.differentiation?.support || "Fornecer apoio com pistas visuais e contagem assistida.",
          challenge: parsed.differentiation?.challenge || "Propor que criem uma nova varia\xE7\xE3o do desafio."
        }
      };
      dbActivities.unshift(createdActivity);
      return res.json(createdActivity);
    } else {
      const fallbackActivity = {
        id: `act-ai-fallback-${Date.now()}`,
        skill_code: competency.code,
        target_skill_code: competency.code,
        skill_name: competency.name,
        description: `Atividade pr\xE1tica adaptada para ${competency.name}.`,
        activity_name: `Laborat\xF3rio Ativo: ${competency.name}`,
        title: `Laborat\xF3rio Ativo: ${competency.name}`,
        track: competency.track,
        required_level: competency.level,
        duration_minutes: 45,
        age_group: "7 a 10 anos",
        suggested_group_size: "Duplas ou quartetos",
        materials: ["Cartelas coloridas", "Material concreto", "Fichas de registro"],
        character_mascot: "Ali",
        created_by_ai: true,
        full_guide: {
          preparation: "Dispor as mesas em formato circular para estimular a coopera\xE7\xE3o social.",
          first_moment: "Roda de sensibiliza\xE7\xE3o com o mascote mediador para levantar hip\xF3teses pr\xE9vias.",
          second_moment: "Desafio em pares com media\xE7\xE3o ajustada \xE0 Zona de Desenvolvimento Proximal.",
          review: "Sistematiza\xE7\xE3o dos aprendizados e registro fotogr\xE1fico no portf\xF3lio escolar."
        },
        differentiation: {
          support: "Reduzir a quantidade de vari\xE1veis simult\xE2neas e fornecer andaime dial\xF3gico.",
          challenge: "Estimular a tutoria entre pares e a formula\xE7\xE3o de problemas correlatos."
        }
      };
      dbActivities.unshift(fallbackActivity);
      return res.json(fallbackActivity);
    }
  } catch (err) {
    console.error("Erro no endpoint generate-ai:", err);
    res.status(500).json({ error: "Erro ao gerar atividade com IA.", details: err.message });
  }
});
app.post("/api/planner/save-activity", (req, res) => {
  const activity = req.body;
  const existingIdx = dbActivities.findIndex((a) => a.id === activity.id);
  if (existingIdx >= 0) {
    dbActivities[existingIdx] = activity;
  } else {
    dbActivities.unshift(activity);
  }
  res.json(activity);
});
app.post("/api/adaptive-test/start", (req, res) => {
  const { assessment_id, student_id, track } = req.body;
  const trackQuestions = SEED_ADAPTIVE_QUESTIONS.filter(
    (q) => q.track === (track || "Leitura")
  );
  const initialQuestion = trackQuestions[0] || SEED_ADAPTIVE_QUESTIONS[0];
  const sessionId = `session-${Date.now()}`;
  const session = {
    id: sessionId,
    assessment_id: assessment_id || "mapa-auto",
    student_id,
    track: track || "Leitura",
    current_skill_index: 0,
    tested_skills: [initialQuestion.skill_code],
    skill_consecutive_hits: {},
    skill_consecutive_misses: {},
    is_finished: false,
    history: []
  };
  dbAdaptiveSessions[sessionId] = session;
  res.json({ session, question: initialQuestion });
});
app.post("/api/adaptive-test/answer", (req, res) => {
  const { session_id, question_id, selected_option_id } = req.body;
  const session = dbAdaptiveSessions[session_id];
  if (!session) {
    return res.status(404).json({ error: "Sess\xE3o adaptativa n\xE3o encontrada." });
  }
  const question = SEED_ADAPTIVE_QUESTIONS.find((q) => q.id === question_id);
  if (!question) {
    return res.status(404).json({ error: "Quest\xE3o n\xE3o encontrada." });
  }
  const isCorrect = question.correct_option_id === selected_option_id;
  const skillCode = question.skill_code;
  session.history.push({
    question_id,
    skill_code: skillCode,
    is_correct: isCorrect,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (isCorrect) {
    session.skill_consecutive_hits[skillCode] = (session.skill_consecutive_hits[skillCode] || 0) + 1;
    session.skill_consecutive_misses[skillCode] = 0;
  } else {
    session.skill_consecutive_misses[skillCode] = (session.skill_consecutive_misses[skillCode] || 0) + 1;
    session.skill_consecutive_hits[skillCode] = 0;
  }
  const skillsInOrder = ["L1", "L2", "L3", "L13", "L38", "MA1", "MA9", "MA15", "MA26"];
  let strictStopFound = false;
  let masteredK = "";
  let proximalK = "";
  for (let i = 0; i < skillsInOrder.length - 1; i++) {
    const k = skillsInOrder[i];
    const kPlus1 = skillsInOrder[i + 1];
    const hitsK = session.skill_consecutive_hits[k] || 0;
    const missesKPlus1 = session.skill_consecutive_misses[kPlus1] || 0;
    if (hitsK >= 2 && missesKPlus1 >= 2) {
      strictStopFound = true;
      masteredK = k;
      proximalK = kPlus1;
      break;
    }
  }
  const totalQuestionsAnswered = session.history.length;
  const shouldFinish = strictStopFound || totalQuestionsAnswered >= 4;
  if (shouldFinish) {
    session.is_finished = true;
    const finalMastered = masteredK || skillCode;
    const finalProximal = proximalK || "L13";
    const studentIdx = dbStudents.findIndex((s) => s.id === session.student_id);
    let updatedStudent = studentIdx >= 0 ? dbStudents[studentIdx] : dbStudents[0];
    let newLevel = updatedStudent.current_level;
    if (finalMastered === "L38" || finalMastered === "MA15" || finalMastered === "MA26") {
      newLevel = "Mochileiro";
    }
    if (studentIdx >= 0) {
      const mergedSkills = Array.from(
        /* @__PURE__ */ new Set([...updatedStudent.mastered_skills, finalMastered])
      );
      dbStudents[studentIdx] = {
        ...updatedStudent,
        mastered_skills: mergedSkills,
        current_level: newLevel,
        last_assessment_score: 85
      };
      updatedStudent = dbStudents[studentIdx];
    }
    const determinedZdp = {
      mastered_skill: finalMastered,
      proximal_skill: finalProximal,
      new_level: newLevel,
      score: isCorrect ? 88 : 80,
      rationale: `Crit\xE9rio de parada Vygotskiano atingido: o estudante dominou a compet\xEAncia ${finalMastered} e encontrou o limite da sua Zona de Desenvolvimento Proximal em ${finalProximal}. N\xEDvel atualizado de forma 100% automatizada.`
    };
    session.detected_zdp = determinedZdp;
    return res.json({
      session,
      isFinished: true,
      determinedZdp,
      updatedStudent
    });
  }
  let nextSkillCode = skillCode;
  const currentIdx = skillsInOrder.indexOf(skillCode);
  if (isCorrect) {
    if (currentIdx >= 0 && currentIdx < skillsInOrder.length - 1) {
      nextSkillCode = skillsInOrder[currentIdx + 1];
    }
  } else {
    if (currentIdx > 0) {
      nextSkillCode = skillsInOrder[currentIdx - 1];
    }
  }
  const answeredIds = session.history.map((h) => h.question_id);
  let nextQuestion = SEED_ADAPTIVE_QUESTIONS.find(
    (q) => q.skill_code === nextSkillCode && !answeredIds.includes(q.id)
  );
  if (!nextQuestion) {
    nextQuestion = SEED_ADAPTIVE_QUESTIONS.find((q) => !answeredIds.includes(q.id));
  }
  res.json({
    session,
    isFinished: false,
    nextQuestion
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`\u{1F680} ATIVA Full-Stack Server rodando na porta ${PORT}`);
    console.log(`\u{1F4D6} Swagger API Docs dispon\xEDvel em: http://localhost:${PORT}/api/docs`);
  });
}
startServer();
