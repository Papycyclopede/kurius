// services/curatedContentService.ts

const curatedFrenchBooksChild = ["Le Petit Prince", "Max et les Maximonstres", "Le Gruffalo"];
const curatedEnglishBooksChild = ["Where the Wild Things Are", "The Very Hungry Caterpillar", "Goodnight Moon"];
const curatedFrenchBooksTeen = ["Harry Potter à l'école des sorciers", "Le Seigneur des Anneaux", "Hunger Games"];
const curatedEnglishBooksTeen = ["Harry Potter and the Sorcerer's Stone", "The Hobbit", "The Hunger Games"];
const curatedFrenchBooksAdult = ["L'Étranger", "1984", "Dune"];
const curatedEnglishBooksAdult = ["1984", "Brave New World", "Dune"];

export const getCuratedBooks = (language: 'fr' | 'en', ageRange: 'child' | 'teen' | 'adult'): string[] => {
    if (language === 'fr') {
        switch (ageRange) {
            case 'child': return curatedFrenchBooksChild;
            case 'teen': return curatedFrenchBooksTeen;
            default: return curatedFrenchBooksAdult;
        }
    } 
    switch (ageRange) {
        case 'child': return curatedEnglishBooksChild;
        case 'teen': return curatedEnglishBooksTeen;
        default: return curatedEnglishBooksAdult;
    }
};

// --- MODIFICATION MAJEURE : Les clés de genre sont maintenant des identifiants neutres pour la traduction ---
export const genresWithExamples = {
  child: {
    film: {
      animation: ['Toy Story', 'Le Roi Lion'],
      family: ['Paddington', 'E.T. the Extra-Terrestrial'],
      adventure: ['How to Train Your Dragon', 'Kubo and the Two Strings'],
      fantasy: ['The Chronicles of Narnia', 'My Neighbor Totoro']
    },
    tvShow: {
      animation: ['Avatar: The Last Airbender', 'Bluey'],
      kids: ['Sesame Street', 'Hilda'],
      comedy: ['SpongeBob SquarePants', 'Phineas and Ferb']
    },
    book: {
      picture_book: ['Where the Wild Things Are', 'The Very Hungry Caterpillar'],
      fantasy: ['The Gruffalo', 'Matilda by Roald Dahl'],
      adventure: ['Treasure Island', 'The Hobbit']
    }
  },
  teen: {
    film: {
      adventure: ['Spider-Man: Into the Spider-Verse', 'Pirates of the Caribbean'],
      science_fiction: ['Star Wars: A New Hope', 'The Matrix'],
      fantasy: ['Harry Potter and the Sorcerer\'s Stone', 'The Lord of the Rings'],
      comedy: ['Back to the Future', 'Mean Girls'],
      action: ['The Dark Knight', 'Mad Max: Fury Road'],
      horror: ['Get Out', 'A Quiet Place'],
      animation: ['Spirited Away', 'Akira']
    },
    tvShow: {
      sci_fi_fantasy: ['Stranger Things', 'Doctor Who'],
      action_adventure: ['The Mandalorian', 'Sherlock'],
      drama: ['The Queen\'s Gambit', 'One Day'],
      comedy: ['Brooklyn Nine-Nine', 'Ted Lasso'],
      animation: ['Arcane', 'Rick and Morty']
    },
    book: {
      young_adult: ['The Hunger Games', 'Six of Crows'],
      fantasy: ['Eragon', 'His Dark Materials'],
      science_fiction: ["Ender's Game", 'The Hitchhiker\'s Guide to the Galaxy'],
      horror: ['It by Stephen King', 'Dracula']
    }
  },
  adult: {
    film: {
      drama: ['The Godfather', 'Forrest Gump'],
      thriller: ['The Silence of the Lambs', 'Parasite'],
      science_fiction: ['Blade Runner 2049', 'Arrival'],
      crime: ['Pulp Fiction', 'Knives Out'],
      comedy: ['Superbad', 'Le Dîner de Cons'],
      adventure: ['Indiana Jones and the Raiders of the Lost Ark', 'Jurassic Park'],
      horror: ['The Shining', 'Hereditary'],
      animation: ['Spirited Away', 'Ghost in the Shell'],
      documentary: ['Planet Earth', 'Man on Wire']
    },
    tvShow: {
      drama: ['Breaking Bad', 'Succession'],
      thriller: ['True Detective', 'Mindhunter'],
      comedy: ['Fleabag', 'The Office'],
      crime: ['The Sopranos', 'Ozark'],
      sci_fi_fantasy: ['Black Mirror', 'The Expanse']
    },
    book: {
      classic: ['1984 by George Orwell', 'To Kill a Mockingbird'],
      thriller: ['Gone Girl', 'The Silent Patient'],
      historical_fiction: ['All the Light We Cannot See', 'The Song of Achilles'],
      non_fiction: ['Sapiens: A Brief History of Humankind', 'Educated by Tara Westover'],
      science_fiction: ['Dune', 'Foundation']
    }
  }
};

export const getGenreNamesForCategory = (
  category: 'film' | 'tvShow' | 'book', 
  ageRange: 'child' | 'teen' | 'adult'
) => {
    return Object.keys(genresWithExamples[ageRange][category]);
};

export const moodKeywords = {
  fr: {
    'Léger & Amusant': ['lighthearted', 'comedy', 'feel-good', 'humor', 'charming'],
    'Intense & Captivant': ['suspenseful', 'thrilling', 'intense', 'gripping', 'drama'],
    'Aventure & Évasion': ['adventure', 'epic', 'fantasy', 'action', 'world-building'],
    'Réfléchi & Profond': ['thought-provoking', 'cerebral', 'drama', 'biography', 'historical'],
    'Soirée en Famille': ['family-friendly', 'heartwarming', 'animation', 'adventure'],
  },
  en: {
    'Light & Fun': ['lighthearted', 'comedy', 'feel-good', 'humor', 'charming'],
    'Intense & Gripping': ['suspenseful', 'thrilling', 'intense', 'gripping', 'drama'],
    'Adventure & Escape': ['adventure', 'epic', 'fantasy', 'action', 'world-building'],
    'Thoughtful & Deep': ['thought-provoking', 'cerebral', 'drama', 'biography', 'historical'],
    'Family Night': ['family-friendly', 'heartwarming', 'animation', 'adventure'],
  }
};

export const curatedContentService = {
    getCuratedBooks,
    genresWithExamples,
    getGenreNamesForCategory,
    moodKeywords,
};