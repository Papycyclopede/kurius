// services/demoDataService.ts

// Données fictives pour simuler une expérience complète pour le jury.

export const getDemoCircles = () => [
    { id: 'circle-1', name: 'Soirées Cinéma 🎬', description: 'Le rendez-vous des cinéphiles de la famille.' },
    { id: 'circle-2', name: 'Club de Lecture 📚', description: 'On dévore les livres, et on en parle !' },
    { id: 'circle-3', name: 'Vacances d\'été ☀️', description: 'Pour préparer nos prochaines aventures.' },
  ];
  
  export const getDemoFriends = () => [
    { id: 'friend-1', full_name: 'Alexandre Dupont', avatar_url: 'https://i.pravatar.cc/150?u=alexandre' },
    { id: 'friend-2', full_name: 'Marie Curie', avatar_url: 'https://i.pravatar.cc/150?u=marie' },
    { id: 'friend-3', full_name: 'Jean Moulin', avatar_url: 'https://i.pravatar.cc/150?u=jean' },
  ];
  
  export const getDemoFriendRequests = () => [
    {
      id: 'request-1',
      requester_id: 'user-4',
      profiles: [{ full_name: 'Camille Claudel', avatar_url: 'https://i.pravatar.cc/150?u=camille' }],
    },
  ];
  