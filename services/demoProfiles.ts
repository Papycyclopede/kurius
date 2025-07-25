// services/demoProfiles.ts

import { ParticipantPreferences } from './recommendationService';

// On utilise un "Record" (un dictionnaire) pour lier un nom de membre à ses goûts.
export const demoProfiles: Record<string, Omit<ParticipantPreferences, 'name'>> = {
  'Papa': {
    films: ['Blade Runner', 'Interstellar', 'Le Parrain'],
    books: ['Dune', 'Fondation', '1984'],
    musics: ['Pink Floyd', 'Dire Straits', 'Jean-Michel Jarre'],
  },
  'Maman': {
    films: ['Orgueil et Préjugés', 'Le Fabuleux Destin d\'Amélie Poulain', 'La La Land'],
    books: ['Jane Eyre', 'L\'Écume des jours', 'Mange, prie, aime'],
    musics: ['Ella Fitzgerald', 'Norah Jones', 'Ludovico Einaudi'],
  },
  'Tom': {
    films: ['Le Voyage de Chihiro', 'Spider-Man: Into the Spider-Verse', 'Toy Story'],
    books: ['Harry Potter', 'Le Seigneur des Anneaux', 'Une BD de Tintin'],
    musics: ['Daft Punk', 'Gorillaz', 'Madeon'],
  },
  'Lisa': {
    films: ['La Reine des neiges', 'Mon Voisin Totoro', 'Harry Potter à l\'école des sorciers'],
    books: ['Le Petit Prince', 'Matilda', 'Les Contes de Grimm'],
    musics: ['Angèle', 'Taylor Swift', 'Les musiques des films Disney'],
  },
  'Alex': {
    films: ['Pulp Fiction', 'Fight Club', 'Parasite'],
    books: ['L\'Étranger', 'Sur la route', 'American Psycho'],
    musics: ['The Strokes', 'Arctic Monkeys', 'Nirvana'],
  },
  'Marie': {
    films: ['Eternal Sunshine of the Spotless Mind', 'Before Sunrise', 'Her'],
    books: ['La délicatesse', 'Just Kids', 'Virginia Woolf'],
    musics: ['Lana Del Rey', 'The xx', 'Bon Iver'],
  },
  'Paul': {
    films: ['Le Seigneur des Anneaux', 'Star Wars', 'Gladiator'],
    books: ['Le Trône de fer', 'Le Nom du vent', 'Cycle de Fondation'],
    musics: ['Hans Zimmer', 'Ramin Djawadi', 'Queen'],
  }
};