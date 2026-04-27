import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LC</span>
            </div>
            <span className="text-xl font-semibold text-primary">
              Libre Compta
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="text-muted hover:text-primary transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
            >
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
            Votre comptabilité BNC,
            <br />
            <span className="text-accent">enfin simple.</span>
          </h1>
          <p className="text-lg text-muted mb-8 max-w-lg mx-auto">
            Saisissez vos recettes et dépenses, Libre Compta génère
            automatiquement votre déclaration 2035. Conçu pour les médecins,
            avocats, architectes et toutes les professions libérales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inscription"
              className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-light transition-colors"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="#fonctionnalites"
              className="border border-border text-primary px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-lighter transition-colors"
            >
              Découvrir
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="fonctionnalites" className="bg-card border-t border-border py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-primary text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Saisie simplifiée",
                desc: "Entrez vos recettes et dépenses en quelques clics. Catégorisation automatique selon les rubriques 2035.",
              },
              {
                title: "Grand livre & Balance",
                desc: "Visualisez votre comptabilité en temps réel. Tous les calculs sont automatiques.",
              },
              {
                title: "Déclaration 2035",
                desc: "Générez votre formulaire 2035 prêt à déposer. Export PDF inclus.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl p-6 border border-border"
              >
                <h3 className="font-semibold text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted">
        <p>&copy; 2026 Libre Compta. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
