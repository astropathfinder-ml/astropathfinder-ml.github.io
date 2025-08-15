
import type { TeamMember, ContentItem } from './types';

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Dr. Ryan Felton',
    photoUrl: '/assets/ryanfelton.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/ryan-felton-phd-astronomer/',
    websiteUrl: 'https://www.nasa.gov/people/ryan-felton/',
    // objectPosition: 'object-center',
  },
  {
    name: 'Dr. Caleb Scharf',
    photoUrl: '/assets/calebscharf.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/caleb-scharf-21137024/',
    websiteUrl: 'https://www.nasa.gov/people/caleb-scharf/',
    objectPosition: 'object-[25%]',
  },
];

export const UNSUPERVISED_DR_CONTENT: ContentItem[] = [
    {
        title: "Principal Component Analysis (PCA)",
        description: "PCA is a technique used to emphasize variation and bring out strong patterns in a dataset. It's often used to make data easy to explore and visualize by reducing the number of variables (dimensions).",
        imageUrl: "/assets/pca1.png"
    },
    {
        title: "Kernel PCA",
        description: "An extension of PCA which can handle non-linearly separable data. Kernel PCA works by projecting the data into a higher-dimensional space where it becomes linearly separable, and then applying standard PCA.",
        // imageUrl: "/assets/kernel-pca.png"
    },
    {
        title: "t-Distributed Stochastic Neighbor Embedding (t-SNE)",
        description: "t-SNE is a powerful technique for visualizing high-dimensional data. It models each high-dimensional object by a two- or three-dimensional point in such a way that similar objects are modeled by nearby points and dissimilar objects are modeled by distant points.",
        imageUrl: "/assets/tsne.webp"
    }
];

export const UNSUPERVISED_CLUSTERING_CONTENT: ContentItem[] = [
    {
        title: "K-Means Clustering",
        description: "K-Means is an algorithm that aims to partition 'n' observations into 'k' clusters in which each observation belongs to the cluster with the nearest mean (cluster centroid), serving as a prototype of the cluster.",
        imageUrl: "/assets/kmeans.png"
    },
    {
        title: "DBSCAN (Density-Based Spatial Clustering of Applications with Noise)",
        description: "DBSCAN is a density-based clustering algorithm. It groups together points that are closely packed together, marking as outliers points that lie alone in low-density regions. It's particularly good at finding non-linearly shaped clusters.",
        imageUrl: "/assets/dbscan.png"
    }
];

export const SUPERVISED_REGRESSION_CONTENT: ContentItem[] = [
    {
        title: "What is Regression?",
        description: "Regression is a supervised learning technique used to predict a continuous outcome variable. For example, predicting the temperature of an exoplanet based on its atmospheric composition or estimating the age of a star based on its luminosity.",
        imageUrl: "/assets/regression.png"
    },
    {
        title: "Linear Regression",
        description: "The simplest form of regression. It models the relationship between a dependent variable and one or more independent variables by fitting a linear equation (a straight line) to the observed data.",
        imageUrl: "/assets/linear-regression.png"
    },
    {
        title: "Random Forest Regression",
        description: "A powerful ensemble method that operates by constructing a multitude of decision trees at training time. It outputs the average prediction of the individual trees, making it robust against overfitting.",
        imageUrl: "/assets/random-forest.png"
    }
];

export const SUPERVISED_CLASSIFICATION_CONTENT: ContentItem[] = [
    {
        title: "What is Classification?",
        description: "Classification is a supervised learning technique used to predict a categorical class label. For example, classifying a celestial object as a star, galaxy, or quasar, or determining if an exoplanet is potentially habitable based on its features.",
        imageUrl: "/assets/classification.png"
    },
    {
        title: "Support Vector Machines (SVM)",
        description: "An SVM is a powerful classifier that works by finding the optimal boundary or hyperplane that best separates data points into different classes. It's especially effective for complex, non-linear problems like defining the habitable zone.",
        imageUrl: "/assets/svm.png"
    },
    {
        title: "Convolutional Neural Networks (CNN)",
        description: "CNNs are a class of deep neural networks, most commonly applied to analyze visual imagery. They are ideal for identifying patterns in images, making them perfect for tasks like finding planetary transits in starfield data.",
        imageUrl: "/assets/cnn.png"
    }
];