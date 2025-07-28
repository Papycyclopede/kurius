Parfait, liens reçus.

Voici le fichier `README.md` mis à jour avec les liens de votre vidéo YouTube et de votre projet Devpost, comme demandé.

-----

# 🟡 Kurius

*The cultural assistant that creates consensus, not compromise.*

Kurius est un assistant culturel mobile conçu pour aider les petits groupes (familles, amis) à trouver l'œuvre parfaite (film, série, livre) à apprécier ensemble, en traduisant les préférences culturelles de chacun en un consensus intelligent.

  
*(Pensez à remplacer ce lien par l'URL de votre image IMG\_5564.jpg une fois hébergée)*

-----

### ► [Vidéo de Démonstration sur YouTube](https://www.youtube.com/watch?v=RC5taKtVO1E&ab_channel=AlexandreSanchez)

### ► [Présentation du Projet sur Devpost](https://devpost.com/software/kurius)

-----

## 💡 Fonctionnalités Principales (What it does)

  * **Accueil Conversationnel :** Discutez directement avec l'IA Kurius pour qu'elle apprenne vos goûts en temps réel grâce à l'API Qloo.
  * **Création de Profils Intelligente ("Taste Wizard") :** Un assistant guidé qui cartographie l'ADN culturel de chaque membre. Il propose des sélections de genres exhaustives et adaptées à l'âge pour une personnalisation immédiate.
  * **Moteur de Consensus de Groupe :** Le cœur de Kurius analyse les profils du groupe, en prenant en compte les favoris (signaux positifs) et les œuvres rejetées (signaux négatifs) pour une pertinence maximale.
  * **Explications par IA :** Chaque suggestion est accompagnée d'une explication générée par Gemini, détaillant *pourquoi* c'est un bon choix pour votre groupe spécifique.
  * **Vote & Souvenirs :** Les membres votent pour leur œuvre préférée, et chaque choix final est sauvegardé dans un journal de "Souvenirs" partagés.
  * **Architecture Scalable :** Le code est conçu pour être maintenable et évolutif, avec par exemple des composants de recherche réutilisables qui faciliteront l'ajout de nouvelles catégories (podcasts, jeux vidéo) à l'avenir.

-----

## 🚀 Stack Technique (Tech Stack)

Kurius repose sur une stack moderne et une orchestration intelligente de plusieurs services d'IA de pointe.

  * **IA & Orchestration :**

      * **Qloo API :** Le moteur central pour l'analyse des goûts et la génération de recommandations de groupe.
      * **Gemini (Google) :** Génère les explications textuelles personnalisées.
      * **Supabase Edge Functions :** Pour l'orchestration sécurisée des appels API.

  * **Fondation Mobile :**

      * **React Native (Expo) :** Pour une application mobile multi-plateforme robuste.
      * **TypeScript :** Pour un code sûr et maintenable.
      * **Supabase :** Utilisé pour l'authentification, la base de données PostgreSQL sécurisée (RLS), et le stockage de fichiers.

  * **Couche d'Expérience Utilisateur (UX) :**

      * **TMDb & Google Books APIs :** Pour enrichir les recommandations avec des métadonnées et des visuels.
      * **ElevenLabs :** Pour la synthèse vocale qui donne vie à la voix de Kurius.
      * **react-native-reanimated :** Pour des animations fluides qui renforcent l'aspect "cocon" de l'application.

-----

## 🛠️ Installation

Ce projet a été développé avec Expo. La manière la plus simple de le tester est via l'application **Expo Go** sur votre appareil mobile.

1.  **Cloner le repository :**

    ```bash
    git clone https://github.com/votre-nom/kurius.git
    cd kurius
    ```

2.  **Installer les dépendances :**

    ```bash
    npm install
    ```

3.  **Configurer les variables d'environnement :**
    Créez un fichier `.env` à la racine du projet et ajoutez vos clés API (Supabase, Qloo, Gemini, etc.).

4.  **Lancer le projet :**

    ```bash
    npm run dev
    ```

    Scannez ensuite le QR code avec l'application Expo Go sur votre téléphone.