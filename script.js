(function () {
  "use strict";

  const root = document.documentElement;

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  /* ---------- i18n ----------
   * English lives in the HTML. On load we snapshot it, so only Portuguese
   * needs to be kept here. Keys match the data-i18n attributes.
   */
  const PT = {
    skip: "Pular para o conteúdo",
    "nav.about": "Sobre",
    "nav.experience": "Experiência",
    "nav.work": "Projetos",
    "nav.stack": "Stack",
    "nav.contact": "Contato",

    "hero.tagline": "Playwright · C# · API · Mobile · QA com IA",
    "hero.status": "Aberto a vagas de Sr QA / SDET · Remoto · Curitiba, BR (UTC−3)",
    "hero.role": "Sr. QA Engineer / Software Engineer in Test",
    "hero.lede": "Construo automação de testes em que o time pode confiar, em web, iOS e Android, para produtos de fintech e iGaming.",
    "hero.interestLabel": "interesses:",
    "hero.interest": "testes de IA · engenharia de IA",
    "cta.contact": "Entre em contato",
    "cta.resume": "Baixar currículo",

    "run.header": "Executando 5 testes com 1 worker",
    "run.l1": "experiência ›",
    "run.l2": "plataformas ›",
    "run.l3": "migrações ›",
    "run.l4": "ia ›",
    "run.l5": "escala ›",
    "run.t1": "4+ anos · fintech &amp; iGaming",
    "run.t3": "tempo de regressão reduzido em 80%+",
    "run.t4": "planejamento de testes: 3–4 dias → ~2 horas",
    "run.t5": "migração de site com 500+ páginas validada",
    "run.summary": "5 passaram",

    "about.eyebrow": "// sobre",
    "about.title": "Qualidade que vai junto com o código.",
    "about.p1": "Sou Sr. QA Engineer e Software Engineer in Test com <strong>4+ anos</strong> construindo e mantendo automação de testes para plataformas de fintech e iGaming. Escrevo testes em <strong>Playwright (C#/.NET e TypeScript)</strong> e <strong>Cypress</strong>, testo e simulo APIs com Postman, Charles Proxy e Mockoon, e automatizo apps mobile nativos com <strong>XCUITest</strong> e <strong>Espresso</strong>.",
    "about.p2": "Gosto de ser responsável pela qualidade de ponta a ponta em times remotos: estratégia de testes, regressão multiplataforma e migração de frameworks. Cada vez mais meu trabalho envolve <strong>QA assistido por IA</strong>, como gerar suítes de teste com servidores MCP, transformar requisitos em planos de teste e usar IA para revisar código. É nessa área que quero crescer: <strong>testar produtos com IA e construir ferramentas de IA</strong> para times de engenharia.",
    "about.c1.t": "Automação web",
    "about.c1.d": "Playwright (C# e TypeScript, POM), testes E2E e de componentes com Cypress, verificações de acessibilidade com cypress-axe.",
    "about.c2.t": "Mobile nativo",
    "about.c2.d": "XCUITest e Espresso, BrowserStack e Sauce Labs, regressão multiplataforma em iOS, Android e web.",
    "about.c3.t": "APIs &amp; mocks",
    "about.c3.d": "Validação REST e testes de integração de backend, inspeção de tráfego com Charles Proxy, mocks de API com Mockoon.",
    "about.c4.t": "QA com IA",
    "about.c4.d": "Geração de testes via MCP, automação de requisitos para planos de teste e revisão de código assistida por IA.",

    "exp.eyebrow": "// git log --autor=andre",
    "exp.title": "Experiência",
    "exp.head": "HEAD → atual",
    "exp.k.role": "Software Engineer in Test",
    "exp.k.date": "Jan 2025 – Atual",
    "exp.k.loc": "Atenas, Grécia (Remoto)",
    "exp.k.b1": "Iniciei um projeto de <strong>QA Revamp</strong> para refatorar e limpar a suíte de testes automatizados e acompanhar seus resultados, para que o time possa confiar no que os testes reportam.",
    "exp.k.b2": "Criei suítes de automação web do zero e desenhei <strong>estratégias de mock para interfaces com dados ao vivo</strong> (estatísticas de jogadores, gráficos ao vivo), resolvendo falhas recorrentes de mock no Playwright. Ampliei a cobertura da integração de backend até Web, Android e iOS.",
    "exp.k.b3": "Substituí verificações manuais de tradução por uma <strong>suíte automatizada de regressão de localização</strong>.",
    "exp.k.b4": "Responsável pela regressão completa semanal em <strong>iOS, Android e Web</strong> do produto de streaming ao vivo do sportsbook por <strong>12+ meses</strong>, e conduzi spikes técnicos que embasaram decisões de arquitetura.",
    "exp.q.role": "Sr. QA Engineer",
    "exp.q.date": "Mar 2023 – Set 2026",
    "exp.q.loc": "Toronto, Canadá (Remoto)",
    "exp.q.b1": "Liderei o QA da <strong>migração completa de um site com 500+ páginas</strong>, cobrindo funcionalidade, acessibilidade, SEO, paridade inglês/francês e conformidade de consentimento. Encontrei <strong>10+ defeitos de produção</strong>, incluindo uma falha crítica de privacidade, e fui responsável pela decisão de go/no-go do lançamento.",
    "exp.q.b2": "Liderei duas migrações de framework de testes: Robot Framework → Playwright, reduzindo o tempo de regressão em <strong>80%+</strong>, e depois Playwright → Cypress para adicionar testes de componente e relatórios no Cypress Cloud.",
    "exp.q.b3": "Desenhei do zero a arquitetura de QA de um novo produto: suítes de smoke, sanity e regressão, varreduras automáticas de acessibilidade, testes de redirecionamento orientados a dados e suporte a múltiplos ambientes.",
    "exp.q.b4": "Construí fluxos com IA e servidores MCP que geram suítes E2E completas <strong>em menos de 1 hora</strong>, além de uma ferramenta de apoio ao QA que reduziu o planejamento de testes de <strong>3–4 dias para ~2 horas</strong>.",
    "exp.q.b5": "Automatizei <strong>200+ testes funcionais</strong> e implementei revisão de código assistida por IA antes dos PRs, reduzindo idas e vindas nas revisões.",
    "exp.t.role": "Analista de QA de Software",
    "exp.t.date": "Jun 2020 – Jan 2023",
    "exp.t.loc": "Curitiba, Brasil",
    "exp.t.b1": "Responsável pelo planejamento de testes e pela cobertura de casos extremos nos lançamentos de produto, encontrando defeitos antes do lançamento.",
    "exp.t.b2": "Melhorei os fluxos de testes funcionais, mantendo múltiplas plataformas estáveis ao longo dos ciclos de release.",
    "exp.t.chip": "Testes funcionais",

    "work.eyebrow": "// projetos em destaque",
    "work.title": "Projetos em destaque",
    "lbl.context": "contexto",
    "lbl.approach": "abordagem",
    "lbl.result": "resultado",
    "work.w1.m": "500+ páginas",
    "work.w1.t": "Migração de plataforma do site",
    "work.w1.c": "Um site público com mais de 500 páginas migrando para um novo CMS e front-end (Contentful + Next.js), com requisitos bilíngues, de acessibilidade e de privacidade.",
    "work.w1.a": "Shift-left: testes rodando localmente durante o desenvolvimento, testes de componente escritos junto com os novos componentes e a regressão E2E em Cypress desenhada com apoio de IA desde os requisitos.",
    "work.w1.r": "<strong>10+ defeitos de produção</strong> encontrados antes do lançamento, incluindo um problema crítico em que o tracking disparava antes do consentimento do usuário. Fui responsável pela aprovação de QA para o go-live.",
    "work.w2.m": "−80% no tempo de regressão",
    "work.w2.t": "Duas migrações de framework",
    "work.w2.c": "A regressão rodava em Robot Framework, que era lento e difícil de manter. Depois, a migração completa do site exigiu testes de componente escritos junto com os novos componentes e uma cobertura bem maior.",
    "work.w2.a": "<strong>Robot Framework → Playwright</strong> para uma suíte moderna, mais confiável, fácil de manter e muito mais rápida. Depois, <strong>Playwright → Cypress</strong>: o Cypress tem testes de componente estáveis, enquanto no Playwright eles ainda são experimentais, e o Cypress Cloud traz rastreabilidade e relatórios de cada execução.",
    "work.w2.r": "Tempo de regressão reduzido em <strong>cerca de 80%</strong> com a migração para o Playwright. A migração para o Cypress trouxe testes de componente, mais cobertura para o site migrado e histórico de execuções e relatórios claros no Cypress Cloud.",
    "work.w3.m": "3–4 dias → ~2 h",
    "work.w3.t": "Fluxos de QA com IA",
    "work.w3.c": "O planejamento de testes levava de 3 a 4 dias, e as suítes E2E eram escritas totalmente à mão.",
    "work.w3.a": "Conectei servidores MCP ao fluxo de automação para gerar suítes E2E e de página completas, criei uma ferramenta de apoio ao QA que transforma requisitos em planos de teste e adicionei revisão de código com IA antes dos PRs.",
    "work.w3.r": "Suítes completas geradas <strong>em menos de 1 hora</strong>, planejamento de testes reduzido para <strong>~2 horas</strong> e menos retrabalho nas revisões.",
    "work.w4.t": "Sportsbook &amp; streaming ao vivo",
    "work.w4.c": "Uma plataforma de apostas esportivas com dados ao vivo e streaming de vídeo em Web, iOS e Android, onde os testes dependem de dados em tempo real.",
    "work.w4.a": "Estratégias de mock para interfaces com dados ao vivo, suítes de automação criadas do zero, verificações automáticas de localização e um <strong>QA Revamp</strong> em andamento, que iniciei para refatorar a suíte e acompanhar os resultados para que as falhas sejam confiáveis.",
    "work.w4.r": "<strong>12+ meses</strong> responsável pela regressão semanal em todas as plataformas, além de spikes técnicos que embasaram decisões de arquitetura, incluindo uma prova de conceito para um endpoint de streaming unificado.",
    "work.training": "$ ls ~/projetos-de-curso",
    "work.w3.link": "→ veja aplicado neste site",

    "ai.eyebrow": "// git log --oneline redesenho",
    "ai.title": "Como este site foi feito",
    "ai.lede": "Esta página é um exemplo do fluxo de trabalho com IA que uso no dia a dia. Eu a construí em uma sessão com o <strong>Claude Code</strong>: eu defini a direção, tomei as decisões de conteúdo e design e revisei cada mudança. A IA pesquisou, implementou e testou em um navegador real.",
    "ai.s1.k": "01 · auditoria",
    "ai.s2.k": "02 · planejamento",
    "ai.s3.k": "03 · iteração",
    "ai.s4.k": "04 · verificação",
    "ai.s1.t": "Primeiro, checar os fatos",
    "ai.s1.d": "Comparei o site antigo com meu currículo e LinkedIn. Ele exagerava a experiência, omitia um empregador atual e mostrava números que eu não conseguia comprovar. Nova regra: toda afirmação precisa vir do currículo, e nenhum número é inventado.",
    "ai.s2.t": "Decidir pensando em quem lê",
    "ai.s2.d": "Analisei um site de referência no estilo terminal e mantive o visual, mas escolhi uma página com rolagem normal em vez de um shell interativo, porque recrutadores leem em menos de um minuto. Removi arquivos de Jekyll e CI sem uso e criei um deploy estático simples.",
    "ai.s3.t": "Corrigir o que a revisão encontra",
    "ai.s3.d": "Minha revisão guiou cada rodada: jargões internos de projetos viraram resultados em linguagem simples, e um menu mobile que ficava aberto sobre o conteúdo virou uma barra de abas sempre visível, com áreas de toque de 44px e um cabeçalho que se esconde durante a leitura.",
    "ai.s4.t": "Testar antes de publicar",
    "ai.s4.d": "Cada mudança foi verificada em um navegador real, em tamanhos de celular, tablet e desktop, antes do commit, em commits pequenos que podem ser revisados separadamente. As verificações estão no relatório de QA.",
    "ai.r.title": "Verificações feitas neste site",
    "ai.r1": "Varredura de acessibilidade com axe-core (WCAG 2.2 AA + boas práticas): 0 violações, nos temas escuro e claro",
    "ai.r2": "Layout em 375 / 768 / 1280 px: sem rolagem horizontal",
    "ai.r3": "Áreas de toque medidas: toda aba do menu mobile com ≥ 44px de altura",
    "ai.r4": "EN / PT-BR: todos os textos traduzidos, menu cabe nos dois idiomas",
    "ai.r5": "Navegação: seção ativa correta até a última; cabeçalho que esconde/aparece, foco por teclado e movimento reduzido",
    "ai.r6": "Links e arquivos funcionando (currículo em PDF, ícone); sem erros no console",
    "ai.r7": "Conteúdo: afirmações conferidas com o currículo; busca por jargões internos",
    "ai.r.summary": "7 passaram",
    "ai.c1": "deploy estático no Pages, Jekyll removido",
    "ai.c2": "currículo em PDF + ícone",
    "ai.c3": "redesign da página",
    "ai.c4": "traduções PT-BR",
    "ai.c5": "README",
    "ai.c6": "menu mobile sempre visível",
    "ai.c7": "abas de 44px + cabeçalho que se esconde",
    "ai.c8": "este registro do processo",
    "ai.roles": "<strong>Eu:</strong> direção, conteúdo, decisões de UX, revisão e aprovação. <strong>IA:</strong> pesquisa, código, testes no navegador, commits. <strong>Ferramentas:</strong> Claude Code, axe-core, git, GitHub Pages.",
    "footer.built": "feito com IA, testado por um QA",

    "stack.eyebrow": "// cat ferramentas.json",
    "stack.title": "Ferramentas que uso",
    "stack.web": "web",
    "stack.mobile": "mobile",
    "stack.api": "api",
    "stack.lang": "linguagens &amp; dados",
    "stack.ci": "ci/cd &amp; observabilidade",
    "stack.ai": "qa com ia",
    "stack.practice": "prática",
    "stack.sim": "Simuladores iOS",
    "stack.rest": "Validação REST",
    "stack.integration": "Integração de backend",
    "stack.ai1": "Geração de testes via MCP",
    "stack.ai2": "Revisão de código com IA",
    "stack.ai3": "Requisitos → planos de teste",
    "stack.p1": "Estratégia &amp; planejamento de testes",
    "stack.p2": "Testes exploratórios",
    "stack.p3": "Regressão multiplataforma",
    "stack.p4": "Testes de acessibilidade",
    "stack.p5": "Melhoria de processos",

    "edu.eyebrow": "// formação",
    "edu.title": "Formação &amp; reconhecimento",
    "edu.k1": "formação",
    "edu.degree": "Tecnólogo em Análise e Desenvolvimento de Sistemas",
    "edu.degreeMeta": "Descomplica · 2025 · Média 9,36/10",
    "edu.courses": "Também: CS50x (Harvard), QA Automation Training Program, Cypress eXpress, OneBitCode.",
    "edu.k2": "prêmio",
    "edu.award": "Por iniciativa e liderança na criação e manutenção de testes automatizados em um dos principais fluxos do projeto.",
    "edu.k3": "idiomas",
    "edu.pt": "Português",
    "edu.native": "nativo",
    "edu.en": "Inglês",
    "edu.full": "profissional completo",
    "edu.es": "Espanhol",
    "edu.basic": "básico",

    "contact.eyebrow": "// ./contato --agora",
    "contact.title": "Vamos falar sobre qualidade.",
    "contact.text": "Procurando um Sr. QA Engineer ou SDET para cuidar da automação em web, mobile e APIs, ou alguém animado para testar produtos com IA? Vou gostar de conversar.",

    "label.nav": "Principal",
    "label.career": "Resumo da carreira no formato de uma execução de testes aprovada",
    "label.tech": "Tecnologias"
  };

  const UI = {
    en: { toLight: "Switch to light theme", toDark: "Switch to dark theme", lang: "Language" },
    pt: { toLight: "Mudar para tema claro", toDark: "Mudar para tema escuro", lang: "Idioma" }
  };

  const nodes = Array.from(document.querySelectorAll("[data-i18n]"));
  const EN = {};
  nodes.forEach((el) => { EN[el.dataset.i18n] = el.innerHTML; });

  // Accessible names (aria-label) are translated the same way, keyed by data-i18n-label.
  const labelled = Array.from(document.querySelectorAll("[data-i18n-label]"));
  labelled.forEach((el) => { EN[el.dataset.i18nLabel] = el.getAttribute("aria-label"); });

  let lang = "en";

  function setLang(next) {
    lang = next === "pt" ? "pt" : "en";
    const dict = lang === "pt" ? PT : EN;
    nodes.forEach((el) => {
      const value = dict[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    labelled.forEach((el) => {
      const value = dict[el.dataset.i18nLabel];
      if (value !== undefined) el.setAttribute("aria-label", value);
    });
    root.lang = lang === "pt" ? "pt-BR" : "en";
    document.querySelectorAll(".lang-switch button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
    document.querySelector(".lang-switch").setAttribute("aria-label", UI[lang].lang);
    syncThemeLabel();
    syncOverflow();
    store("lang", lang);
  }

  document.querySelectorAll(".lang-switch button").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });

  /* ---------- Theme ---------- */
  const themeBtn = document.querySelector(".theme-btn");

  function syncThemeLabel() {
    const dark = root.dataset.theme !== "light";
    themeBtn.setAttribute("aria-label", dark ? UI[lang].toLight : UI[lang].toDark);
  }

  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    store("theme", root.dataset.theme);
    syncThemeLabel();
  });

  /* ---------- Active section in nav ---------- */
  const navLinks = document.getElementById("nav-links");
  const links = Array.from(navLinks.querySelectorAll("a"));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  let activeId;

  function markActive(id) {
    if (id === activeId) return;
    activeId = id;
    links.forEach((a) => {
      const on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("active", on);
      if (on) {
        a.setAttribute("aria-current", "true");
        // On mobile the links row scrolls sideways; keep the active one visible.
        if (navLinks.scrollWidth > navLinks.clientWidth) {
          navLinks.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: "smooth" });
        }
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function updateActive() {
    // At the bottom of the page the last sections can't reach the top, so pick the last one.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      markActive(sections[sections.length - 1].id);
      return;
    }
    const line = window.innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= line) current = s.id;
    });
    markActive(current);
  }

  // Fade the row's edge only when the tabs don't fit (very narrow phones).
  function syncOverflow() {
    navLinks.classList.toggle("is-overflowing", navLinks.scrollWidth > navLinks.clientWidth + 1);
  }

  /* ---------- Hide header on scroll down (mobile & tablet) ---------- */
  const topbar = document.querySelector(".topbar");
  const compact = window.matchMedia("(max-width: 820px)");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  let lastY = window.scrollY;

  function updateHeader() {
    const y = window.scrollY;
    if (!compact.matches || calm.matches || y < 120 || topbar.querySelector(":focus-visible")) {
      topbar.classList.remove("is-hidden");
      lastY = y;
      return;
    }
    // Ignore small jitters; act once the scroll has moved a few pixels.
    if (Math.abs(y - lastY) < 8) return;
    topbar.classList.toggle("is-hidden", y > lastY);
    lastY = y;
  }

  topbar.addEventListener("focusin", () => {
    if (topbar.querySelector(":focus-visible")) topbar.classList.remove("is-hidden");
  });

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateActive(); updateHeader(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", () => { updateActive(); updateHeader(); syncOverflow(); });
  updateActive();

  /* ---------- Init ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  const saved = store("lang");
  const initial = saved || ((navigator.language || "").toLowerCase().startsWith("pt") ? "pt" : "en");
  setLang(initial);
})();
