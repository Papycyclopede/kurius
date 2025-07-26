// services/curatedContentService.ts

// Listes pour les enfants
const curatedFrenchBooksChild = ["Le Petit Prince", "Max et les Maximonstres", "Le Gruffalo", "La Chèvre de Monsieur Seguin", "Les Contes du chat perché", "Matilda", "Charlie et la Chocolaterie"];
const curatedEnglishBooksChild = ["Where the Wild Things Are", "The Very Hungry Caterpillar", "Goodnight Moon", "The Gruffalo", "Matilda", "Charlie and the Chocolate Factory", "The Cat in the Hat"];

// Listes pour les adolescents
const curatedFrenchBooksTeen = ["Harry Potter à l'école des sorciers", "Le Seigneur des Anneaux", "L'Écume des jours", "Le Grand Meaulnes", "Les Royaumes du Nord", "Hunger Games", "Divergente"];
const curatedEnglishBooksTeen = ["Harry Potter and the Sorcerer's Stone", "The Hobbit", "The Catcher in the Rye", "The Hunger Games", "To Kill a Mockingbird", "The Outsiders", "Divergent"];

// Listes pour les adultes
const curatedFrenchBooksAdult = ["L'Étranger", "Voyage au bout de la nuit", "La Promesse de l'aube", "1984", "Dune", "Le Nom de la Rose", "L'Insoutenable Légèreté de l'être"];
const curatedEnglishBooksAdult = ["1984", "Brave New World", "Dune", "The Great Gatsby", "Moby Dick", "Pride and Prejudice", "Fahrenheit 451"];


/**
 * Retourne une liste de titres de livres pertinents en fonction de la langue et de l'âge.
 * @param language La langue sélectionnée ('fr' ou 'en').
 * @param ageRange La tranche d'âge ('child', 'teen', 'adult').
 * @returns Un tableau de titres de livres.
 */
export const getCuratedBooks = (language: 'fr' | 'en', ageRange: 'child' | 'teen' | 'adult'): string[] => {
    if (language === 'fr') {
        switch (ageRange) {
            case 'child': return curatedFrenchBooksChild;
            case 'teen': return curatedFrenchBooksTeen;
            default: return curatedFrenchBooksAdult;
        }
    } else { // 'en'
        switch (ageRange) {
            case 'child': return curatedEnglishBooksChild;
            case 'teen': return curatedEnglishBooksTeen;
            default: return curatedEnglishBooksAdult;
        }
    }
};