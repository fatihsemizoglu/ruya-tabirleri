import { Link } from 'react-router-dom';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export function AlphabetSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            A'dan Z'ye Rüya Tabirleri
          </h2>
          <p className="text-muted-foreground">
            Alfabetik sırayla tüm rüya tabirlerine ulaşın
          </p>
        </div>

        {/* Alphabet Grid */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-4xl mx-auto">
          {alphabet.map((letter) => (
            <Link
              key={letter}
              to={`/az/${letter.toLowerCase()}`}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-lg md:text-xl font-serif font-semibold transition-all duration-200 hover:scale-110 hover:shadow-lg"
            >
              {letter}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
