import type { CSSProperties } from "react";
import { ArrowDown, ArrowRight, LogIn } from "lucide-react";
import manifest from "@/brand/manifests/icons.json";
import { startLogin } from "@/const";

const subsystemPresentation: Record<
  string,
  { token: string; description: string }
> = {
  "fluxo-da-contratacao": {
    token: "var(--orbita-subsystem-flow)",
    description:
      "Da necessidade à execução. Organize as etapas, os documentos e as responsabilidades de cada contratação.",
  },
  transparencia: {
    token: "var(--orbita-subsystem-transparency)",
    description:
      "Da informação ao acesso público. Reúna publicações e dê visibilidade aos atos da instituição.",
  },
  "inteligencia-e-suporte": {
    token: "var(--orbita-subsystem-intelligence)",
    description:
      "Do registro à decisão. Conecte gestão, prazos, pesquisa e conhecimento institucional.",
  },
};

const journey = [
  {
    id: "porta",
    step: "01",
    title: "Formalizar a necessidade",
    description: "Demandas e justificativas",
    module: "Porta",
  },
  {
    id: "agenda",
    step: "02",
    title: "Planejar a contratação",
    description: "Prioridades e planejamento anual",
    module: "Agenda",
  },
  {
    id: "maestro",
    step: "03",
    title: "Conduzir o processo",
    description: "Etapas, decisões e documentos",
    module: "Maestro",
  },
  {
    id: "elo",
    step: "04",
    title: "Acompanhar a execução",
    description: "Contratos e responsabilidades",
    module: "Elo",
  },
];

export default function InstitutionalLanding({
  authenticated,
  openWorkspace,
}: {
  authenticated: boolean;
  openWorkspace: () => void;
}) {
  const enter = () => (authenticated ? openWorkspace() : startLogin());
  return (
    <div className="institutional-landing" data-theme="dark">
      <a className="institutional-skip" href="#apresentacao">
        Ir para o conteúdo
      </a>
      <header className="institutional-nav">
        <a href="#apresentacao" aria-label="ÓRBITA, início">
          <img
            className="institutional-logo"
            src="/orbita/brand/svg/signature-intermediate-negative.svg"
            alt="ÓRBITA"
          />
        </a>
        <nav aria-label="Navegação principal">
          <a className="institutional-nav-link" href="#subsistemas">
            A plataforma
          </a>
          <a className="institutional-nav-link" href="#modulos">
            Os módulos
          </a>
          <button
            className="institutional-button institutional-button-outline"
            onClick={enter}
          >
            {authenticated ? "Área de trabalho" : "Acessar sistema"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </nav>
      </header>
      <main id="apresentacao">
        <section
          className="institutional-hero"
          aria-labelledby="institutional-title"
        >
          <div className="institutional-hero-copy">
            <span className="institutional-eyebrow">
              <span />
              Plataforma integrada de contratações públicas
            </span>
            <h1 id="institutional-title">
              Cada etapa conectada.
              <br />
              <em>Cada decisão em contexto.</em>
            </h1>
            <p>
              Da primeira demanda à execução contratual, um ambiente para
              organizar o trabalho, conduzir decisões e preservar a memória da
              instituição.
            </p>
            <div className="institutional-actions">
              <button
                className="institutional-button institutional-button-primary"
                onClick={enter}
              >
                <LogIn size={18} aria-hidden="true" />
                {authenticated
                  ? "Abrir área de trabalho"
                  : "Entrar com conta institucional"}
              </button>
              <a className="institutional-explore" href="#subsistemas">
                Conheça a plataforma <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
            <div className="institutional-facts">
              <span>
                <strong>03</strong> subsistemas integrados
              </span>
              <span>
                <strong>20</strong> módulos na arquitetura
              </span>
            </div>
          </div>
          <aside
            className="institutional-journey"
            aria-label="Visão do ciclo de contratação"
          >
            <div className="institutional-journey-heading">
              <span>O ciclo da contratação</span>
              <span className="institutional-journey-caption">
                Visão da plataforma
              </span>
            </div>
            <ol>
              {journey.map(item => (
                <li key={item.id}>
                  <span className="institutional-journey-icon">
                    <img src={`/orbita/modules/${item.id}/icone.svg`} alt="" />
                  </span>
                  <div>
                    <small>
                      {item.module} <span> / {item.step}</span>
                    </small>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="institutional-journey-footer">
              <img src="/orbita/modules/memoria/icone.svg" alt="" />
              <span>Uma memória institucional ao longo de todo o ciclo.</span>
            </div>
          </aside>
        </section>
        <section
          className="institutional-subsystems"
          id="subsistemas"
          aria-labelledby="institutional-subsystems-title"
        >
          <div className="institutional-section-heading">
            <span className="institutional-eyebrow">
              Uma plataforma. Três frentes.
            </span>
            <h2 id="institutional-subsystems-title">
              O trabalho se divide.
              <br />A informação permanece conectada.
            </h2>
            <p>
              Uma estrutura que acompanha a contratação e dá contexto a quem
              participa de cada etapa.
            </p>
          </div>
          <div className="institutional-subsystem-grid">
            {manifest.subsystems.map((sub, index) => (
              <article
                key={sub.id}
                style={
                  {
                    "--subsystem-color": subsystemPresentation[sub.id].token,
                  } as CSSProperties
                }
              >
                <div className="institutional-subsystem-top">
                  <img
                    src={`/orbita/subsystems/${sub.id}/icone-subsistema.svg`}
                    alt=""
                  />
                  <span>
                    0{index + 1} / {sub.modules.length} módulos
                  </span>
                </div>
                <h3>{sub.name}</h3>
                <p>{subsystemPresentation[sub.id].description}</p>
                <a href={`#modules-${sub.id}`}>
                  Explorar os módulos{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section
          className="institutional-modules"
          id="modulos"
          aria-labelledby="institutional-modules-title"
        >
          <div className="institutional-section-heading">
            <span className="institutional-eyebrow">A arquitetura ÓRBITA</span>
            <h2 id="institutional-modules-title">
              Um propósito para cada módulo.
            </h2>
            <p>
              Conheça as frentes que compõem a plataforma. As funcionalidades
              são disponibilizadas de forma gradual, conforme a implantação
              institucional.
            </p>
          </div>
          {manifest.subsystems.map(sub => (
            <section
              className="institutional-module-group"
              id={`modules-${sub.id}`}
              key={sub.id}
              style={
                {
                  "--subsystem-color": subsystemPresentation[sub.id].token,
                } as CSSProperties
              }
              aria-label={sub.name}
            >
              <div className="institutional-module-heading">
                <span />
                <h3>{sub.name}</h3>
                <small>
                  {sub.modules.length.toString().padStart(2, "0")} módulos
                </small>
              </div>
              <div className="institutional-module-grid">
                {sub.modules.map(id => {
                  const mod = manifest.modules.find(item => item.id === id)!;
                  return (
                    <article key={id}>
                      <img src={`/orbita/modules/${id}/icone.svg`} alt="" />
                      <div>
                        <h4>{mod.name}</h4>
                        <p>{mod.role}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
        <section
          className="institutional-access"
          aria-labelledby="institutional-access-title"
        >
          <div>
            <span className="institutional-eyebrow">
              Seu ambiente de trabalho
            </span>
            <h2 id="institutional-access-title">
              A próxima etapa começa aqui.
            </h2>
            <p>Acesse com sua conta institucional para continuar.</p>
          </div>
          <button
            className="institutional-button institutional-button-primary"
            onClick={enter}
          >
            {authenticated ? "Abrir área de trabalho" : "Acessar a ÓRBITA"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </section>
      </main>
      <footer className="institutional-footer">
        <img
          src="/orbita/brand/svg/signature-intermediate-negative.svg"
          alt="ÓRBITA"
        />
        <p>Plataforma Integrada de Contratações Públicas</p>
        <a href="#apresentacao">Voltar ao início ↑</a>
      </footer>
    </div>
  );
}
