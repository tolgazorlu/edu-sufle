'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Info, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Resource type for learning materials
interface Resource {
  title: string;
  description: string;
  url: string;
}

// Todo concept with associated resources
interface Concept {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  resources: Resource[];
}

// Right drawer component for displaying concept details
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  concept: Concept | null;
}

const ConceptDrawer: React.FC<DrawerProps> = ({ open, onClose, concept }) => {
  if (!concept) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 z-50 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Drawer panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out border-l border-gray-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-indigo-700">{concept.title}</h2>
            <button 
              onClick={onClose} 
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">Click on any resource to open it in a new tab</p>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 70px)" }}>
          {/* Concept description section */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-2">About this concept:</h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-gray-700">
              {concept.description}
            </div>
          </div>
          
          {/* Resources section */}
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3">Learning resources:</h3>
            {concept.resources && concept.resources.length > 0 ? (
              <div className="space-y-4">
                {concept.resources.map((resource: Resource, index: number) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-indigo-600 mb-1">{resource.title}</h3>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                    <div className="mt-2 text-xs text-gray-400 truncate">{resource.url}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>No resources available for this concept.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function Todo() {
  const [todoText, setTodoText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sample resources for demonstration
  const sampleResources: { [key: string]: Resource[] } = {
    'React Fundamentals': [
      {
        title: 'React Official Documentation',
        description: 'The official React documentation covering all the core concepts and APIs',
        url: 'https://reactjs.org/docs/getting-started.html'
      },
      {
        title: 'React Hooks In-Depth',
        description: 'A comprehensive guide to using React Hooks effectively in your applications',
        url: 'https://reactjs.org/docs/hooks-intro.html'
      },
      {
        title: 'React Patterns and Best Practices',
        description: 'Advanced patterns and best practices for building scalable React applications',
        url: 'https://kentcdodds.com/blog/advanced-react-patterns'
      }
    ],
    'State Management': [
      {
        title: 'Redux Documentation',
        description: 'The complete guide to Redux state management for React applications',
        url: 'https://redux.js.org/introduction/getting-started'
      },
      {
        title: 'Context API Deep Dive',
        description: 'Understanding React Context API for simpler state management',
        url: 'https://reactjs.org/docs/context.html'
      },
      {
        title: 'Zustand: Simplified State Management',
        description: 'A small, fast and scalable state-management solution for React',
        url: 'https://github.com/pmndrs/zustand'
      }
    ],
    'Next.js': [
      {
        title: 'Next.js Documentation',
        description: 'The official Next.js documentation covering routing, API routes, and more',
        url: 'https://nextjs.org/docs'
      },
      {
        title: 'Next.js App Router',
        description: 'Understanding the new App Router in Next.js 13 and beyond',
        url: 'https://nextjs.org/docs/app'
      },
      {
        title: 'Server Components in Next.js',
        description: 'How to use React Server Components in Next.js applications',
        url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components'
      }
    ],
    'Authentication': [
      {
        title: 'NextAuth.js Documentation',
        description: 'Authentication for Next.js applications made simple',
        url: 'https://next-auth.js.org/getting-started/introduction'
      },
      {
        title: 'JWT Authentication Guide',
        description: 'Implementing JWT authentication in Next.js applications',
        url: 'https://auth0.com/blog/next-js-authentication-tutorial/'
      },
      {
        title: 'OAuth Implementation',
        description: 'How to implement OAuth authentication in your web applications',
        url: 'https://oauth.net/getting-started/'
      }
    ],
    'CSS Frameworks': [
      {
        title: 'Tailwind CSS Documentation',
        description: 'The official documentation for the utility-first CSS framework',
        url: 'https://tailwindcss.com/docs'
      },
      {
        title: 'Styled Components',
        description: 'Using styled-components for component-based styling in React',
        url: 'https://styled-components.com/docs'
      },
      {
        title: 'CSS Modules with React',
        description: 'How to use CSS Modules for locally scoped styles in React applications',
        url: 'https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/'
      }
    ]
  };

  // Generate concept descriptions
  const getConceptDescription = (title: string): string => {
    const descriptions: { [key: string]: string } = {
      'React Fundamentals': 'React is a JavaScript library for building user interfaces. Learn about components, JSX, props, state, and lifecycle methods that form the foundation of React development.',
      'State Management': 'State management is crucial for complex React applications. Explore different patterns and libraries for managing state, including Redux, Context API, and simpler alternatives.',
      'Next.js': 'Next.js is a React framework that provides server-side rendering, static site generation, and other optimizations out of the box. Learn how to build production-ready applications.',
      'Authentication': 'Authentication is essential for securing your applications. Discover various authentication strategies including JWT, OAuth, and session-based authentication.',
      'CSS Frameworks': 'CSS frameworks accelerate UI development by providing pre-built components and utilities. Learn about modern approaches to styling React applications.'
    };
    
    return descriptions[title] || 'Learn more about this important concept in web development.';
  };

  // Get resources for a concept
  const getResourcesForConcept = (title: string): Resource[] => {
    return sampleResources[title] || [];
  };

  // Generate concepts based on the provided todo text
  const generateConcepts = async () => {
    if (!todoText) return;
    
    setIsLoading(true);
    
    // Simulate API call with a delay
    setTimeout(() => {
      // Create at least 5 concepts from our predefined list
      const conceptKeys = Object.keys(sampleResources);
      const selectedKeys = conceptKeys.slice(0, 5);
      
      const newConcepts = selectedKeys.map((title, index) => ({
        id: `concept-${Date.now()}-${index}`,
        title,
        description: getConceptDescription(title),
        completed: false,
        resources: getResourcesForConcept(title)
      }));
      
      setConcepts(newConcepts);
      setIsLoading(false);
    }, 1500);
  };

  // Handle clicking on concept to show resources
  const handleConceptClick = (concept: Concept) => {
    setSelectedConcept(concept);
    setDrawerOpen(true);
  };

  // Toggle concept completion status
  const toggleConceptComplete = (id: string) => {
    setConcepts(concepts.map(concept => 
      concept.id === id ? { ...concept, completed: !concept.completed } : concept
    ));
  };

  // Delete a concept
  const deleteConcept = (id: string) => {
    setConcepts(concepts.filter(concept => concept.id !== id));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-700">Todo Learning Path</h1>
      
      {/* Input section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 p-2 px-5 bg-gradient-to-r from-violet-500/80 to-indigo-400/80 hover:from-violet-500/90 hover:to-indigo-400/90 backdrop-blur-md rounded-full shadow-lg border border-violet-300/30 transition-all relative">
          <div className="relative flex-1">
            <Input 
              placeholder="What do you want to learn today?"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') generateConcepts();
              }}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 text-white placeholder:text-white/80"
              autoFocus
            />
          </div>
          <Button 
            onClick={generateConcepts} 
            disabled={isLoading}
            className="rounded-full px-6 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Concepts'
            )}
          </Button>
        </div>
      </div>
      
      {/* Concepts section */}
      <div className="space-y-4">
        {concepts.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Learning Concepts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {concepts.map(concept => (
                <div
                  key={concept.id}
                  className={cn(
                    "p-4 rounded-lg border-2 hover:border-indigo-300 hover:shadow-md transition-all relative",
                    concept.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      className={cn(
                        "font-medium text-lg cursor-pointer",
                        concept.completed ? "text-green-700 line-through" : "text-indigo-600"
                      )}
                      onClick={() => handleConceptClick(concept)}
                    >
                      {concept.title}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleConceptComplete(concept.id)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        {concept.completed ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <Circle className="h-5 w-5 text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => deleteConcept(concept.id)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {concept.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {concept.resources.length} resources available
                    </span>
                    <button
                      onClick={() => handleConceptClick(concept)}
                      className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      Learn more
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-12 w-12 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Generating your learning concepts...</p>
              </div>
            ) : (
              <div className="text-center max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="mb-2">Enter a topic above to generate learning concepts</p>
                <p className="text-sm text-gray-400">Example topics: Modern Web Development, Machine Learning Basics, Blockchain Development</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Concept details drawer */}
      <ConceptDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        concept={selectedConcept}
      />
    </div>
  );
} 