import TemplatePointers from "./components/TemplatePointers";

function LandingIntro() {
  return (
    <div className="hero min-h-full rounded-l-xl bg-base-200">
      <div className="hero-content py-12">
        <div className="max-w-md">
          <h1 className="text-3xl text-center font-bold">
            <img
              src="/stock-management.png"
              className="w-12 inline-block mr-2 mask mask-circle"
              alt="Logo Gestion de Stock OCP"
            />
            Gestion de Stock OCP
          </h1>
          <p className="text-center mt-4 text-lg">
            Simplifiez la gestion d'inventaire pour OCP avec des outils intelligents et des insights en temps réel.
          </p>
          <div className="text-center mt-6">
            <img
              src="./intro.png"
              alt="Tableau de Bord de Gestion de Stock"
              className="w-48 inline-block"
            />
          </div>
          {/* Points forts des fonctionnalités */}
          <TemplatePointers />
        </div>
      </div>
    </div>
  );
}

export default LandingIntro;