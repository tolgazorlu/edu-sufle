'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Info, X, ExternalLink, Edit, Save, Clock, Star, Calendar, Filter, BarChart, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

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
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Right drawer component for displaying concept details
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  concept: Concept | null;
  onResourceAdd: (conceptId: string, resource: Resource) => void;
  onResourceDelete: (conceptId: string, resourceIndex: number) => void;
  onConceptUpdate: (conceptId: string, updates: Partial<Concept>) => void;
}

const ConceptDrawer: React.FC<DrawerProps> = ({ 
  open, 
  onClose, 
  concept, 
  onResourceAdd, 
  onResourceDelete,
  onConceptUpdate 
}) => {
  const [newResource, setNewResource] = useState<Resource>({ title: '', description: '', url: '' });
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [editableDueDate, setEditableDueDate] = useState('');
  const [editablePriority, setEditablePriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (concept) {
      setEditableTitle(concept.title);
      setEditableDescription(concept.description);
      setEditableDueDate(concept.dueDate || '');
      setEditablePriority(concept.priority || 'medium');
    }
  }, [concept]);

  if (!concept) return null;

  const handleSubmitResource = () => {
    if (!newResource.title || !newResource.url) return;
    onResourceAdd(concept.id, newResource);
    setNewResource({ title: '', description: '', url: '' });
    setIsAddingResource(false);
  };

  const handleSaveDetails = () => {
    if (!editableTitle) return;
    
    onConceptUpdate(concept.id, {
      title: editableTitle,
      description: editableDescription,
      dueDate: editableDueDate,
      priority: editablePriority
    });
    
    setIsEditingDetails(false);
  };

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
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {concept.completed ? 'Completed' : 'Pending'}
            </span>
            {concept.dueDate && (
              <span className="text-sm text-blue-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Due: {new Date(concept.dueDate).toLocaleDateString()}
              </span>
            )}
            {concept.priority && (
              <span className={`text-sm flex items-center ${
                concept.priority === 'high' ? 'text-red-500' : 
                concept.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                <Star className="h-3 w-3 mr-1" />
                {concept.priority.charAt(0).toUpperCase() + concept.priority.slice(1)}
              </span>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 70px)" }}>
          {/* Concept details section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-800">Details</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className="flex items-center text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Details
              </Button>
            </div>
            
            {isEditingDetails ? (
              <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Title</label>
                  <Input
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Description</label>
                  <Input
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={editableDueDate}
                    onChange={(e) => setEditableDueDate(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Priority</label>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant={editablePriority === 'low' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEditablePriority('low')}
                      className={editablePriority === 'low' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      Low
                    </Button>
                    <Button 
                      type="button" 
                      variant={editablePriority === 'medium' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEditablePriority('medium')}
                      className={editablePriority === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      Medium
                    </Button>
                    <Button 
                      type="button" 
                      variant={editablePriority === 'high' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setEditablePriority('high')}
                      className={editablePriority === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      High
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingDetails(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveDetails}
                    disabled={!editableTitle}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-gray-700">
                {concept.description}
              </div>
            )}
          </div>
          
          {/* Resources section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-800">Learning resources:</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingResource(true)}
                className="flex items-center text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Resource
              </Button>
            </div>

            {/* Add resource form */}
            {isAddingResource && (
              <div className="p-4 mb-4 border border-indigo-200 rounded-lg bg-indigo-50">
                <h4 className="text-sm font-medium mb-2 text-indigo-700">Add New Resource</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Resource Title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    className="w-full text-sm"
                  />
                  <Input
                    placeholder="URL (https://...)"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    className="w-full text-sm"
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsAddingResource(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSubmitResource}
                      disabled={!newResource.title || !newResource.url}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {concept.resources && concept.resources.length > 0 ? (
              <div className="space-y-4">
                {concept.resources.map((resource: Resource, index: number) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all relative group"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-indigo-600 mb-1">{resource.title}</h3>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => window.open(resource.url, '_blank')}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </button>
                        <button 
                          onClick={() => onResourceDelete(concept.id, index)}
                          className="p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
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

// Task statistics component
interface StatsProps {
  concepts: Concept[];
}

const TaskStats: React.FC<StatsProps> = ({ concepts }) => {
  // Calculate statistics
  const total = concepts.length;
  const completed = concepts.filter(c => c.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Count by priority
  const highPriority = concepts.filter(c => c.priority === 'high').length;
  const mediumPriority = concepts.filter(c => c.priority === 'medium').length;
  const lowPriority = concepts.filter(c => c.priority === 'low').length;
  
  // Count overdue tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = concepts.filter(c => {
    if (!c.completed && c.dueDate) {
      const dueDate = new Date(c.dueDate);
      return dueDate < today;
    }
    return false;
  }).length;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">Task Statistics</h3>
        <div className="flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-indigo-500" />
          <span className="text-sm font-medium text-gray-600">Progress Overview</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <div className="text-indigo-600 text-xl font-semibold">{total}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-green-600 text-xl font-semibold">{completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-yellow-600 text-xl font-semibold">{pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-red-600 text-xl font-semibold">{overdue}</div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-gray-500">Completion</span>
          <span className="text-xs font-medium text-indigo-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-xs text-gray-500">High: {highPriority}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-xs text-gray-500">Medium: {mediumPriority}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-xs text-gray-500">Low: {lowPriority}</span>
        </div>
      </div>
    </div>
  );
};

export default function Todo() {
  const [todoText, setTodoText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [newConcept, setNewConcept] = useState<Omit<Concept, 'id'>>({
    title: '',
    description: '',
    completed: false,
    resources: [],
    dueDate: '',
    priority: 'medium'
  });
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [filterOption, setFilterOption] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Load todos from localStorage on initial render
  useEffect(() => {
    const savedConcepts = localStorage.getItem('todo-concepts');
    if (savedConcepts) {
      try {
        setConcepts(JSON.parse(savedConcepts));
      } catch (e) {
        console.error('Failed to parse saved concepts', e);
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todo-concepts', JSON.stringify(concepts));
  }, [concepts]);

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

  // Add a concept with sample data
  const addSampleConcept = (title: string, priority: 'low' | 'medium' | 'high', dueDate: string = '') => {
    const concept: Concept = {
      id: `sample-${Date.now()}`,
      title,
      description: getConceptDescription(title),
      completed: false,
      resources: getResourcesForConcept(title),
      priority,
      dueDate
    };
    
    setConcepts(prev => [concept, ...prev]);
  };

  // Generate concepts based on the provided todo text
  const generateConcepts = async () => {
    if (!todoText.trim()) return;
    
    setIsLoading(true);
    setAiError(null);
    
    try {
      const response = await fetch('/api/todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: todoText.trim() }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setAiError(data.error);
        console.error('Error generating concepts:', data.error);
      }
      
      if (data.result?.concepts && Array.isArray(data.result.concepts)) {
        // Add unique IDs to ensure no collisions
        const newConcepts = data.result.concepts.map((concept: any) => ({
          ...concept,
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Ensure dueDate and priority fields exist
          dueDate: concept.dueDate || '',
          priority: concept.priority || 'medium'
        }));
        
        setConcepts(prev => [...newConcepts, ...prev]);
        setTodoText('');
      } else {
        setAiError('Failed to generate concepts. Try a different topic.');
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      setAiError('Network error or invalid response. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  // Add a concept manually
  const addConceptManually = () => {
    if (!newConcept.title) return;
    
    const concept: Concept = {
      ...newConcept,
      id: `manual-${Date.now()}`,
    };
    
    setConcepts([...concepts, concept]);
    setNewConcept({
      title: '',
      description: '',
      completed: false,
      resources: [],
      dueDate: '',
      priority: 'medium'
    });
    setDialogOpen(false);
  };

  // Set preset task templates
  const setSimpleTask = () => {
    setNewConcept({
      title: '',
      description: '',
      completed: false,
      resources: [],
      dueDate: '',
      priority: 'medium'
    });
    setDialogOpen(true);
    setShowAddOptions(false);
  };

  const setPriorityTask = () => {
    setNewConcept({
      title: 'Important Task',
      description: 'High priority task that needs attention',
      completed: false,
      resources: [],
      dueDate: '',
      priority: 'high'
    });
    setDialogOpen(true);
    setShowAddOptions(false);
  };

  const setScheduledTask = () => {
    setNewConcept({
      title: 'Scheduled Task',
      description: 'Task with a deadline',
      completed: false,
      resources: [],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      priority: 'medium'
    });
    setDialogOpen(true);
    setShowAddOptions(false);
  };

  // Start editing a concept
  const startEditingConcept = (concept: Concept) => {
    setEditingConcept(concept.id);
  };

  // Save edited concept
  const saveEditedConcept = (id: string, updatedTitle: string, updatedDescription: string) => {
    if (!updatedTitle) return;
    
    setConcepts(concepts.map(concept => 
      concept.id === id 
        ? { ...concept, title: updatedTitle, description: updatedDescription } 
        : concept
    ));
    
    setEditingConcept(null);
  };

  // Add resource to a concept
  const addResourceToConcept = (conceptId: string, resource: Resource) => {
    setConcepts(concepts.map(concept => 
      concept.id === conceptId 
        ? { ...concept, resources: [...concept.resources, resource] } 
        : concept
    ));
  };

  // Delete resource from a concept
  const deleteResourceFromConcept = (conceptId: string, resourceIndex: number) => {
    setConcepts(concepts.map(concept => 
      concept.id === conceptId 
        ? { ...concept, resources: concept.resources.filter((_, i) => i !== resourceIndex) } 
        : concept
    ));
  };

  // Filter concepts based on search query
  const filteredConcepts = concepts.filter(concept => {
    // First filter by completion status
    if (filterOption === 'completed' && !concept.completed) return false;
    if (filterOption === 'pending' && concept.completed) return false;
    
    // Then by search query
    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    return (
      concept.title.toLowerCase().includes(query) ||
      concept.description.toLowerCase().includes(query)
    );
  });

  // Update a concept's details
  const updateConceptDetails = (conceptId: string, updates: Partial<Concept>) => {
    setConcepts(concepts.map(concept => 
      concept.id === conceptId ? { ...concept, ...updates } : concept
    ));
  };

  return (
    <div className="container px-6 py-6 mx-auto h-full flex flex-col">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => setFilterOption('all')}
              className={`flex items-center ${filterOption === 'all' ? 'bg-indigo-100' : ''}`}
            >
              <Filter className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button 
              variant="outline"
              onClick={() => setFilterOption('completed')}
              className={`flex items-center ${filterOption === 'completed' ? 'bg-green-100' : ''}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </Button>
            <Button 
              variant="outline"
              onClick={() => setFilterOption('pending')}
              className={`flex items-center ${filterOption === 'pending' ? 'bg-yellow-100' : ''}`}
            >
              <Clock className="h-4 w-4 mr-1" />
              Pending
            </Button>
          </div>
          
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowAddOptions(!showAddOptions)}
              disabled={isLoading}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Todo
            </Button>
            
            {showAddOptions && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={setSimpleTask}
                    className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2 text-gray-500" />
                    Simple Todo (Boring 😒)
                  </button>
                  <button
                    onClick={setPriorityTask}
                    className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    Priority Task
                  </button>
                  <button
                    onClick={setScheduledTask}
                    className="text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Scheduled Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search tasks by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 focus-visible:ring-indigo-300 focus-visible:border-indigo-300"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {aiError && (
          <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded-md max-w-3xl">
            {aiError}
          </div>
        )}
      </div>
      
      {/* Show task stats if there are concepts */}
      {concepts.length > 0 && <TaskStats concepts={concepts} />}
      
      {/* Add Concept Dialog - Using shadcn Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-50">
          <DialogHeader>
            <DialogTitle className="text-xl text-indigo-700">Add New Concept</DialogTitle>
            <DialogDescription>
              Fill in the details for your new concept or task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                placeholder="Concept Title"
                value={newConcept.title}
                onChange={(e) => setNewConcept({...newConcept, title: e.target.value})}
                className="w-full border border-gray-300 focus-visible:ring-indigo-300 focus-visible:border-indigo-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                placeholder="Description"
                value={newConcept.description}
                onChange={(e) => setNewConcept({...newConcept, description: e.target.value})}
                className="w-full border border-gray-300 focus-visible:ring-indigo-300 focus-visible:border-indigo-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Due Date (optional)</label>
              <Input
                type="date"
                value={newConcept.dueDate || ''}
                onChange={(e) => setNewConcept({...newConcept, dueDate: e.target.value})}
                className="w-full border border-gray-300 focus-visible:ring-indigo-300 focus-visible:border-indigo-300"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant={newConcept.priority === 'low' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setNewConcept({...newConcept, priority: 'low'})}
                  className={newConcept.priority === 'low' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Low
                </Button>
                <Button 
                  type="button" 
                  variant={newConcept.priority === 'medium' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setNewConcept({...newConcept, priority: 'medium'})}
                  className={newConcept.priority === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Medium
                </Button>
                <Button 
                  type="button" 
                  variant={newConcept.priority === 'high' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setNewConcept({...newConcept, priority: 'high'})}
                  className={newConcept.priority === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  High
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={addConceptManually}
              disabled={!newConcept.title}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Add Concept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Concepts section */}
      <div className="space-y-4 flex-1 overflow-y-auto">
        {concepts.length > 0 ? (
          filteredConcepts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConcepts
                .map(concept => (
                  <div
                    key={concept.id}
                    className={cn(
                      "p-4 rounded-lg border-2 hover:border-indigo-300 hover:shadow-md transition-all relative",
                      concept.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                    )}
                  >
                    {editingConcept === concept.id ? (
                      <>
                        <Input
                          className="mb-2 font-medium"
                          value={concept.title}
                          onChange={(e) => setConcepts(concepts.map(c => 
                            c.id === concept.id ? { ...c, title: e.target.value } : c
                          ))}
                        />
                        <Input
                          className="mb-3 text-sm"
                          value={concept.description}
                          onChange={(e) => setConcepts(concepts.map(c => 
                            c.id === concept.id ? { ...c, description: e.target.value } : c
                          ))}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => setEditingConcept(null)}
                            variant="outline"
                            className="mr-2"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEditedConcept(concept.id, concept.title, concept.description)}
                            disabled={!concept.title}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
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
                              onClick={() => startEditingConcept(concept)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <Edit className="h-5 w-5 text-gray-400" />
                            </button>
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
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">
                              {concept.resources.length} resources available
                            </span>
                            {concept.dueDate && (
                              <span className="text-xs mt-1 flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                                Due: {new Date(concept.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {concept.priority && (
                              <span className={`text-xs mt-1 flex items-center ${
                                concept.priority === 'high' ? 'text-red-500' : 
                                concept.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                <Star className="h-3 w-3 mr-1" />
                                {concept.priority.charAt(0).toUpperCase() + concept.priority.slice(1)} priority
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleConceptClick(concept)}
                            className="flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Learn more
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No tasks match your search criteria.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterOption('all');
                }}
                className="mt-2 text-indigo-500 hover:text-indigo-700 text-sm"
              >
                Clear filters
              </button>
            </div>
          )
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
                <p className="mb-4">Enter a topic above to generate learning concepts</p>
              
                
                <div className="text-left border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-medium text-indigo-600 mb-2">Quick Start with Sample Tasks</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => addSampleConcept('React Fundamentals', 'medium', new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0])}
                      className="block w-full text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-md text-sm transition-colors"
                    >
                      <span className="flex items-center">
                        <Plus className="h-3 w-3 mr-2 text-indigo-500" />
                        Add React Fundamentals
                      </span>
                    </button>
                    <button 
                      onClick={() => addSampleConcept('State Management', 'high')}
                      className="block w-full text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-md text-sm transition-colors"
                    >
                      <span className="flex items-center">
                        <Plus className="h-3 w-3 mr-2 text-indigo-500" />
                        Add State Management (High Priority)
                      </span>
                    </button>
                    <button 
                      onClick={() => addSampleConcept('Next.js', 'low', new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0])}
                      className="block w-full text-left px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-md text-sm transition-colors"
                    >
                      <span className="flex items-center">
                        <Plus className="h-3 w-3 mr-2 text-indigo-500" />
                        Add Next.js (Due in a week)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating input at the bottom */}
      <div className="mb-8 fixed bottom-0 max-w-7xl w-full">
        <div className="flex max-w-2xl mx-auto items-center gap-3 p-2 px-5 bg-gradient-to-r from-cyan-500/90 to-purple-500/90 hover:from-cyan-500 hover:to-purple-500 backdrop-blur-md rounded-full shadow-lg border border-cyan-300/30 transition-all relative">
          <div className="relative flex-1">
            <Input 
              placeholder="What do you want to do today?"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') generateConcepts();
              }}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 text-white placeholder:text-white/80"
              autoFocus
            />
          </div>
          <Button 
            onClick={generateConcepts} 
            disabled={isLoading || !todoText.trim()}
            className="rounded-full px-6 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white border-0 shadow-sm"
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
              <>
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.75 13.25L10.25 18.75L19.25 5.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Concept details drawer */}
      <ConceptDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        concept={selectedConcept}
        onResourceAdd={addResourceToConcept}
        onResourceDelete={deleteResourceFromConcept}
        onConceptUpdate={updateConceptDetails}
      />
    </div>
  );
} 