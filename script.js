document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme system
    initThemeSystem();
    
    // Update the current time
    updateTimeDisplay();
    
    // Load projects
    fetchProjects();
    
    // Setup UI controls
    setupControlsAndEvents();
    
    // Setup modal events
    setupModal();
});

// Global variables
const ITEMS_PER_PAGE = 18; // Increased from 9 to show more posts per page
let currentPage = 1;
let allProjects = [];
let filteredProjects = [];
let currentFilter = 'all';
let activeTags = [];
let tagLogic = 'or'; // Default tag logic is OR
let sortOrder = 'latest'; // Default sort order
let currentView = 'grid'; // Default view mode
let tagCounts = {}; // For tracking tag counts
let searchQuery = ''; // For search functionality

// Available tags configuration
const TAGS = [
    { id: 'android', name: 'Android', icon: 'fa-brands fa-android' },
    { id: 'linux', name: 'Linux', icon: 'fa-brands fa-linux' },
    { id: 'windows', name: 'Windows', icon: 'fa-brands fa-windows' },
    { id: 'mac', name: 'Mac', icon: 'fa-brands fa-apple' },
    { id: 'web', name: 'Web', icon: 'fa-solid fa-globe' },
    { id: 'github', name: 'GitHub', icon: 'fa-brands fa-github' }
];

// Setup all UI controls and event listeners
function setupControlsAndEvents() {
    // Setup navigation filters (All, New, Popular)
    setupNavigationFilters();
    
    // Setup tag logic toggle (AND/OR)
    setupTagLogicToggle();
    
    // Setup view options (Grid/List)
    setupViewOptions();
    
    // Setup sort options
    setupSortOptions();
    
    // Setup search functionality
    setupSearch();
    
    // Setup tag sorting
    setupTagSorting();
}

// Enhanced theme system with auto-switching and color themes
function initThemeSystem() {
    const themeToggle = document.getElementById('theme-toggle');
    const autoThemeToggle = document.getElementById('auto-theme-toggle');
    const lightTimeInput = document.getElementById('light-time');
    const darkTimeInput = document.getElementById('dark-time');
    const colorOptions = document.querySelectorAll('.color-option');
    const themeOptionsToggle = document.getElementById('theme-options-toggle');
    const themeOptionsPanel = document.getElementById('theme-options-panel');
    
    // Load preferences from localStorage
    const savedTheme = localStorage.getItem('theme') || 
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const savedAutoTheme = localStorage.getItem('autoTheme') === 'true';
    const savedLightTime = localStorage.getItem('lightTime') || '08:00';
    const savedDarkTime = localStorage.getItem('darkTime') || '20:00';
    const savedColor = localStorage.getItem('accentColor') || 'default';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    // Apply saved color theme
    if (savedColor !== 'default') {
        document.body.setAttribute('data-color', savedColor);
        document.querySelector(`.color-option[data-color="${savedColor}"]`).classList.add('active');
    } else {
        document.querySelector('.color-option[data-color="default"]').classList.add('active');
    }
    
    // Apply auto theme settings
    autoThemeToggle.checked = savedAutoTheme;
    lightTimeInput.value = savedLightTime;
    darkTimeInput.value = savedDarkTime;
    
    // If auto theme is enabled, schedule theme changes
    if (savedAutoTheme) {
        scheduleThemeChange();
    }
    
    // Toggle theme
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
        
        showPreferencesSaved();
    });
    
    // Toggle auto theme
    autoThemeToggle.addEventListener('change', function() {
        localStorage.setItem('autoTheme', this.checked);
        
        if (this.checked) {
            scheduleThemeChange();
        } else {
            // Clear any scheduled theme changes
            if (window.themeInterval) {
                clearInterval(window.themeInterval);
            }
        }
        
        showPreferencesSaved();
    });
    
    // Change time settings
    lightTimeInput.addEventListener('change', function() {
        localStorage.setItem('lightTime', this.value);
        if (autoThemeToggle.checked) {
            scheduleThemeChange();
        }
        showPreferencesSaved();
    });
    
    darkTimeInput.addEventListener('change', function() {
        localStorage.setItem('darkTime', this.value);
        if (autoThemeToggle.checked) {
            scheduleThemeChange();
        }
        showPreferencesSaved();
    });
    
    // Color theme options
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            
            // Remove active class from all options
            colorOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to selected option
            this.classList.add('active');
            
            // Apply color theme
            if (color === 'default') {
                document.body.removeAttribute('data-color');
            } else {
                document.body.setAttribute('data-color', color);
            }
            
            // Save preference
            localStorage.setItem('accentColor', color);
            showPreferencesSaved();
        });
    });
    
    // Theme options panel toggle
    themeOptionsToggle.addEventListener('click', function() {
        themeOptionsPanel.classList.toggle('active');
    });
    
    // Close theme panel when clicking outside
    document.addEventListener('click', function(e) {
        if (!themeOptionsPanel.contains(e.target) && e.target !== themeOptionsToggle) {
            themeOptionsPanel.classList.remove('active');
        }
    });
}

// Schedule theme changes based on time
function scheduleThemeChange() {
    // Clear any existing interval
    if (window.themeInterval) {
        clearInterval(window.themeInterval);
    }
    
    // Check theme immediately
    checkTimeForTheme();
    
    // Set interval to check every minute
    window.themeInterval = setInterval(checkTimeForTheme, 60000);
}

// Check if we should change theme based on current time
function checkTimeForTheme() {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    const lightTime = localStorage.getItem('lightTime') || '08:00';
    const darkTime = localStorage.getItem('darkTime') || '20:00';
    
    const themeToggle = document.getElementById('theme-toggle');
    
    if (currentTime >= lightTime && currentTime < darkTime) {
        // Day time - use light theme
        document.body.removeAttribute('data-theme');
        themeToggle.checked = false;
        localStorage.setItem('theme', 'light');
    } else {
        // Night time - use dark theme
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
        localStorage.setItem('theme', 'dark');
    }
}

// Show preferences saved notification
function showPreferencesSaved() {
    const notification = document.getElementById('preferences-saved');
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }, 2000);
}

// Setup navigation filters (All, New, Popular)
function setupNavigationFilters() {
    const filterButtons = document.querySelectorAll('.nav-filters button');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            currentFilter = this.getAttribute('data-filter');
            applyFilters();
            
            // Reset to first page when changing filters
            currentPage = 1;
            updatePagination();
            
            // Save preference
            localStorage.setItem('currentFilter', currentFilter);
            showPreferencesSaved();
        });
    });
    
    // Load saved filter preference
    const savedFilter = localStorage.getItem('currentFilter');
    if (savedFilter) {
        const savedFilterButton = document.querySelector(`.nav-filters button[data-filter="${savedFilter}"]`);
        if (savedFilterButton) {
            savedFilterButton.click();
        }
    }
}

// Setup tag logic toggle (AND/OR)
function setupTagLogicToggle() {
    const logicButtons = document.querySelectorAll('.logic-toggle');
    
    logicButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            logicButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            tagLogic = this.getAttribute('data-logic');
            
            // Re-apply filters using new logic
            applyFilters();
            
            // Save preference
            localStorage.setItem('tagLogic', tagLogic);
            showPreferencesSaved();
        });
    });
    
    // Load saved tag logic preference
    const savedTagLogic = localStorage.getItem('tagLogic');
    if (savedTagLogic) {
        const savedLogicButton = document.querySelector(`.logic-toggle[data-logic="${savedTagLogic}"]`);
        if (savedLogicButton) {
            savedLogicButton.click();
        }
    }
}

// Setup view options (Grid/List)
function setupViewOptions() {
    const viewButtons = document.querySelectorAll('.view-options button');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            viewButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            currentView = this.getAttribute('data-view');
            
            // Apply view mode
            document.body.setAttribute('data-view', currentView);
            
            // Create list view container if it doesn't exist
            if (currentView === 'list' && !document.querySelector('.projects-list')) {
                createListViewContainer();
            }
            
            // Re-display projects in the current view
            displayPage(currentPage);
            
            // Save preference
            localStorage.setItem('viewMode', currentView);
            showPreferencesSaved();
        });
    });
    
    // Load saved view mode preference
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode) {
        const savedViewButton = document.querySelector(`.view-options button[data-view="${savedViewMode}"]`);
        if (savedViewButton) {
            savedViewButton.click();
        }
    }
}

// Create list view container
function createListViewContainer() {
    const gridContainer = document.querySelector('.projects-grid');
    const listContainer = document.createElement('div');
    listContainer.className = 'projects-list';
    gridContainer.parentNode.insertBefore(listContainer, gridContainer.nextSibling);
}

// Setup sort options
function setupSortOptions() {
    const sortSelect = document.getElementById('sort-select');
    
    sortSelect.addEventListener('change', function() {
        sortOrder = this.value;
        
        // Sort and display projects
        sortProjects();
        displayPage(currentPage);
        
        // Save preference
        localStorage.setItem('sortOrder', sortOrder);
        showPreferencesSaved();
    });
    
    // Load saved sort order preference
    const savedSortOrder = localStorage.getItem('sortOrder');
    if (savedSortOrder) {
        sortSelect.value = savedSortOrder;
        sortOrder = savedSortOrder;
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Search on button click
    searchButton.addEventListener('click', function() {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilters();
        
        // Reset to first page
        currentPage = 1;
        updatePagination();
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchQuery = this.value.trim().toLowerCase();
            applyFilters();
            
            // Reset to first page
            currentPage = 1;
            updatePagination();
        }
    });
    
    // Clear search on X button
    searchInput.addEventListener('search', function() {
        if (this.value === '') {
            searchQuery = '';
            applyFilters();
            
            // Reset to first page
            currentPage = 1;
            updatePagination();
        }
    });
}

// Setup tag sorting
function setupTagSorting() {
    const sortTagsButton = document.getElementById('sort-tags-button');
    let currentSortMode = localStorage.getItem('tagSortMode') || 'alphabetical';
    
    // Update button appearance based on current sort mode
    updateSortButtonAppearance();
    
    sortTagsButton.addEventListener('click', function() {
        // Toggle between sort modes
        currentSortMode = currentSortMode === 'alphabetical' ? 'count' : 'alphabetical';
        
        // Save preference
        localStorage.setItem('tagSortMode', currentSortMode);
        
        // Update button appearance
        updateSortButtonAppearance();
        
        // Re-setup tag filters with new sorting
        setupTagFilters();
        
        showPreferencesSaved();
    });
    
    function updateSortButtonAppearance() {
        sortTagsButton.title = currentSortMode === 'alphabetical' 
            ? 'Sort tags by count' 
            : 'Sort tags alphabetically';
        
        sortTagsButton.innerHTML = currentSortMode === 'alphabetical'
            ? '<i class="fas fa-sort-alpha-down"></i>'
            : '<i class="fas fa-sort-amount-down"></i>';
            
        sortTagsButton.classList.toggle('active', currentSortMode === 'count');
    }
}

// Update timestamp
function updateTimeDisplay() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    document.getElementById('update-time').textContent = now.toLocaleDateString('en-US', options);
}

// Setup tag filters with counts and sorting
function setupTagFilters() {
    const tagFiltersContainer = document.getElementById('tag-filters');
    tagFiltersContainer.innerHTML = '';
    
    // Get sort mode preference
    const sortMode = localStorage.getItem('tagSortMode') || 'alphabetical';
    
    // Create sorted tag list
    let sortedTags = [...TAGS];
    
    if (sortMode === 'count') {
        // Sort by count (most frequent first)
        sortedTags.sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0));
    } else {
        // Sort alphabetically
        sortedTags.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Create tag buttons
    const tagButtonTemplate = document.getElementById('tag-button-template');
    
    sortedTags.forEach(tag => {
        const tagElement = tagButtonTemplate.content.cloneNode(true);
        const button = tagElement.querySelector('.tag-button');
        
        button.setAttribute('data-tag', tag.id);
        button.querySelector('i').className = tag.icon;
        button.querySelector('.tag-name').textContent = tag.name;
        
        // Add count if available
        const countSpan = button.querySelector('.tag-count');
        const count = tagCounts[tag.id] || 0;
        countSpan.textContent = count;
        
        // Hide count if zero and not active
        if (count === 0 && !activeTags.includes(tag.id)) {
            countSpan.style.display = 'none';
        }
        
        // Mark as active if in active tags
        if (activeTags.includes(tag.id)) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', function() {
            toggleTag(tag.id);
        });
        
        tagFiltersContainer.appendChild(tagElement);
    });
    
    // Update active filters display
    updateActiveFilters();
}

// Toggle a tag filter
function toggleTag(tagId) {
    const tagIndex = activeTags.indexOf(tagId);
    
    if (tagIndex === -1) {
        // Add tag to active filters
        activeTags.push(tagId);
    } else {
        // Remove tag from active filters
        activeTags.splice(tagIndex, 1);
    }
    
    // Update tag buttons UI
    updateTagButtons();
    
    // Update active filters display
    updateActiveFilters();
    
    // Apply filters
    applyFilters();
    
    // Reset pagination to first page
    currentPage = 1;
    updatePagination();
    
    // Save active tags preference
    localStorage.setItem('activeTags', JSON.stringify(activeTags));
    showPreferencesSaved();
}

// Update tag buttons to reflect active state
function updateTagButtons() {
    const tagButtons = document.querySelectorAll('.tag-button');
    
    tagButtons.forEach(button => {
        const tagId = button.getAttribute('data-tag');
        if (activeTags.includes(tagId)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Update active filters display
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('active-filters');
    activeFiltersContainer.innerHTML = '';
    
    // Show active tag filters
    if (activeTags.length > 0) {
        const logic = tagLogic === 'and' ? 'AND' : 'OR';
        
        // Add logic indicator
        if (activeTags.length > 1) {
            const logicElement = document.createElement('div');
            logicElement.className = 'active-filter logic-indicator';
            logicElement.innerHTML = `Using ${logic} logic`;
            activeFiltersContainer.appendChild(logicElement);
        }
        
        // Add active tags
        activeTags.forEach(tagId => {
            const tag = TAGS.find(t => t.id === tagId);
            if (tag) {
                const filterElement = document.createElement('div');
                filterElement.className = 'active-filter';
                filterElement.innerHTML = `
                    <i class="${tag.icon}"></i> ${tag.name}
                    <button data-tag="${tagId}"><i class="fas fa-times"></i></button>
                `;
                
                // Add event listener to remove button
                filterElement.querySelector('button').addEventListener('click', function() {
                    toggleTag(tagId);
                });
                
                activeFiltersContainer.appendChild(filterElement);
            }
        });
    }
    
    // Show search query if active
    if (searchQuery) {
        const searchElement = document.createElement('div');
        searchElement.className = 'active-filter';
        searchElement.innerHTML = `
            <i class="fas fa-search"></i> "${searchQuery}"
            <button id="clear-search"><i class="fas fa-times"></i></button>
        `;
        
        // Add event listener to clear search
        searchElement.querySelector('button').addEventListener('click', function() {
            document.getElementById('search-input').value = '';
            searchQuery = '';
            applyFilters();
            currentPage = 1;
            updatePagination();
        });
        
        activeFiltersContainer.appendChild(searchElement);
    }
}

// Apply all active filters (type, tags, search)
function applyFilters() {
    if (!allProjects.length) return;
    
    // First filter by type (All, New, Popular)
    switch(currentFilter) {
        case 'new':
            const now = new Date().getTime() / 1000;
            filteredProjects = allProjects.filter(project => {
                return (now - project.time) < 86400; // Less than 24 hours old
            });
            break;
        case 'popular':
            filteredProjects = allProjects.filter(project => project.score >= 50);
            break;
        default: // 'all'
            filteredProjects = [...allProjects];
    }
    
    // Then filter by tags if any are active
    if (activeTags.length > 0) {
        if (tagLogic === 'and') {
            // AND logic - project must have ALL selected tags
            filteredProjects = filteredProjects.filter(project => {
                return activeTags.every(tagId => project.tags.includes(tagId));
            });
        } else {
            // OR logic (default) - project must have AT LEAST ONE selected tag
            filteredProjects = filteredProjects.filter(project => {
                return activeTags.some(tagId => project.tags.includes(tagId));
            });
        }
    }
    
    // Apply search filter if search query exists
    if (searchQuery) {
        filteredProjects = filteredProjects.filter(project => {
            const title = project.title ? project.title.toLowerCase() : '';
            const text = project.text ? project.text.toLowerCase() : '';
            const url = project.url ? project.url.toLowerCase() : '';
            
            return title.includes(searchQuery) || 
                   text.includes(searchQuery) || 
                   url.includes(searchQuery);
        });
    }
    
    // Sort projects
    sortProjects();
    
    // Display filtered projects
    displayPage(currentPage);
}

// Sort projects based on current sort order
function sortProjects() {
    switch(sortOrder) {
        case 'popular':
            filteredProjects.sort((a, b) => b.score - a.score);
            break;
        case 'comments':
            filteredProjects.sort((a, b) => (b.descendants || 0) - (a.descendants || 0));
            break;
        case 'latest':
        default:
            filteredProjects.sort((a, b) => b.time - a.time);
            break;
    }
}

// Fetch projects from Hacker News API
async function fetchProjects() {
    try {
        // Show loading indicator
        document.body.classList.remove('loaded');
        
        // Add a status message to the UI
        const projectsContainer = document.getElementById('projects-container');
        projectsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading stories from Hacker News...</p>
            </div>
        `;
        
        // Initialize an array to hold all story IDs from different sources
        let allStoryIds = [];
        
        // Define the Hacker News endpoints we want to fetch from
        const endpoints = [
            'topstories',     // Top stories
            'newstories',     // New stories
            'beststories',    // Best stories
            'showstories',    // Show HN
            'askstories'      // Ask HN
        ];
        
        // Fetch story IDs from all endpoints
        const endpointPromises = endpoints.map(endpoint => 
            fetch(`https://hacker-news.firebaseio.com/v0/${endpoint}.json`)
                .then(response => response.json())
        );
        
        // Wait for all endpoint requests to complete
        const endpointResults = await Promise.all(endpointPromises);
        
        // Combine all story IDs, removing duplicates
        endpointResults.forEach(ids => {
            if (Array.isArray(ids)) {
                allStoryIds = [...allStoryIds, ...ids];
            }
        });
        
        // Remove duplicate story IDs using Set
        allStoryIds = [...new Set(allStoryIds)];
        
        console.log(`Total unique stories found from API endpoints: ${allStoryIds.length}`);
        
        // Get the most recent item ID to determine the latest ID
        const maxIdResponse = await fetch('https://hacker-news.firebaseio.com/v0/maxitem.json');
        const maxId = await maxIdResponse.json();
        console.log(`Current max item ID from Hacker News: ${maxId}`);
        
        // For historical content, we'll also fetch older items by ID
        // We'll grab items from various points in Hacker News history
        // This gives us a broad sample across time rather than just recent posts
        const historicalTimePeriods = [
            // Recent past (last few months)
            { start: maxId - 100000, count: 200 },
            
            // 6 months to 1 year ago (approximate)
            { start: maxId - 500000, count: 200 },
            
            // 1-2 years ago (approximate)
            { start: maxId - 1000000, count: 200 },
            
            // 3-5 years ago (approximate)
            { start: maxId - 3000000, count: 200 },
            
            // Older content (5+ years ago)
            { start: maxId - 8000000, count: 200 }
        ];
        
        // Generate historical IDs to fetch
        let historicalIds = [];
        historicalTimePeriods.forEach(period => {
            if (period.start > 0) {
                // Generate random IDs within the period's range
                for (let i = 0; i < period.count; i++) {
                    const randomOffset = Math.floor(Math.random() * 100000);
                    const id = Math.max(1, period.start + randomOffset);
                    historicalIds.push(id);
                }
            }
        });
        
        // Combine with current stories and remove duplicates
        allStoryIds = [...new Set([...allStoryIds, ...historicalIds])];
        
        console.log(`Total stories to process (including historical): ${allStoryIds.length}`);
        
        // Limit to a reasonable number to avoid performance issues
        // Increase this number for more historical content
        const storiesToFetch = allStoryIds.slice(0, 2000);
        
        // Update loading message with total count
        document.querySelector('.loading p').textContent = 
            `Loading ${storiesToFetch.length} stories from Hacker News...`;
        
        // Fetch details for each story in batches to avoid overwhelming the API
        const BATCH_SIZE = 50;
        let allStories = [];
        let successfulFetches = 0;
        
        for (let i = 0; i < storiesToFetch.length; i += BATCH_SIZE) {
            const batch = storiesToFetch.slice(i, i + BATCH_SIZE);
            
            // Update loading message with progress
            document.querySelector('.loading p').textContent = 
                `Loading stories from Hacker News... (${Math.min(i + BATCH_SIZE, storiesToFetch.length)}/${storiesToFetch.length})`;
            
            const batchPromises = batch.map(id => 
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                    .then(response => response.json())
                    .catch(err => {
                        console.warn(`Failed to fetch item ${id}:`, err);
                        return null;
                    })
            );
            
            try {
                const batchResults = await Promise.all(batchPromises);
                const validResults = batchResults.filter(story => 
                    story !== null && story.type === 'story' && !story.deleted && !story.dead
                );
                
                successfulFetches += validResults.length;
                allStories = [...allStories, ...validResults];
                
                // Update loading message with success count
                document.querySelector('.loading p').textContent = 
                    `Loading stories from Hacker News... (${Math.min(i + BATCH_SIZE, storiesToFetch.length)}/${storiesToFetch.length}) - Found ${successfulFetches} valid stories`;
            } catch (err) {
                console.error('Error fetching batch:', err);
            }
        }
        
        console.log(`Successfully fetched ${allStories.length} valid stories`);
        
        // Save a timestamp of when we last updated the archive
        localStorage.setItem('lastArchiveUpdate', Date.now());
        
        // Expand filter criteria to include more stories that might be interesting projects
        allProjects = allStories.filter(story => {
            // Skip deleted, dead or null stories
            if (!story || story.deleted || story.dead) return false;
            
            // Accept ALL stories that have a URL - most HN posts with links are interesting
            if (story.url) return true;
            
            // Accept all Show HN and Ask HN posts
            if (story.title && (story.title.toLowerCase().includes('show hn') || story.title.toLowerCase().includes('ask hn'))) {
                return true;
            }
            
            // Accept all stories with text content
            if (story.text && story.text.length > 0) {
                return true;
            }
            
            // If we got this far, include any story with a score of at least 5
            if (story.score && story.score >= 5) {
                return true;
            }
            
            return false;
        });
        
        console.log(`Found ${allProjects.length} potential open-source projects`);
        
        // Reset tag counts
        tagCounts = {};
        
        // Assign tags to each project and count occurrences
        allProjects = allProjects.map(project => {
            project.tags = detectTags(project);
            
            // Count tag occurrences
            project.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
            
            return project;
        });
        
        // Add "year" tag to help filter by time period
        allProjects = allProjects.map(project => {
            if (project.time) {
                const year = new Date(project.time * 1000).getFullYear();
                const yearTag = `y${year}`;
                project.tags.push(yearTag);
                tagCounts[yearTag] = (tagCounts[yearTag] || 0) + 1;
            }
            return project;
        });
        
        // Set filtered projects initially to all projects
        filteredProjects = [...allProjects];
        
        // Sort projects
        sortProjects();
        
        // Set up tag filters with counts
        setupTagFilters();
        
        // Load saved active tags
        const savedActiveTags = localStorage.getItem('activeTags');
        if (savedActiveTags) {
            try {
                activeTags = JSON.parse(savedActiveTags);
                updateTagButtons();
                updateActiveFilters();
                applyFilters();
            } catch (e) {
                console.error('Error parsing saved active tags:', e);
            }
        } else {
            // Display first page
            displayPage(currentPage);
        }
        
        // Setup pagination
        setupPagination();
        
    } catch (error) {
        console.error('Error fetching projects:', error);
        displayError();
    }
}

// Enhanced tag detection for projects
function detectTags(project) {
    const tags = [];
    const title = project.title ? project.title.toLowerCase() : '';
    const text = project.text ? project.text.toLowerCase() : '';
    const url = project.url ? project.url.toLowerCase() : '';
    
    // Combined content for better detection
    const combinedContent = `${title} ${text} ${url}`;
    
    // Keywords for each tag
    const tagKeywords = {
        android: ['android', 'kotlin', 'java android', 'mobile app', 'play store', 'apk'],
        linux: ['linux', 'ubuntu', 'debian', 'fedora', 'arch', 'gnu', 'manjaro', 'centos', 'redhat', 'opensuse'],
        windows: ['windows', 'microsoft', '.net', 'win32', 'win64', 'windows 10', 'windows 11', 'powershell', 'wsl'],
        mac: ['mac', 'macos', 'apple', 'osx', 'macbook', 'swift', 'cocoa', 'xcode'],
        web: ['web', 'browser', 'javascript', 'html', 'css', 'react', 'vue', 'angular', 'node', 'typescript', 'frontend', 'backend', 'fullstack', 'responsive'],
        github: ['github.com']
    };
    
    // Check for each tag
    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
        if (keywords.some(keyword => combinedContent.includes(keyword))) {
            tags.push(tag);
        }
    });
    
    return tags;
}

// Setup pagination controls
function setupPagination() {
    // Calculate total pages
    updatePagination();
    
    // Add event listener for pagination container
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const action = e.target.getAttribute('data-action');
            
            if (action === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (action === 'next' && currentPage < getTotalPages()) {
                currentPage++;
            } else if (action === 'page') {
                currentPage = parseInt(e.target.textContent);
            }
            
            displayPage(currentPage);
            updatePagination();
            
            // Scroll to top of results
            document.querySelector('.projects-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// Update pagination controls
function updatePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    const totalPages = getTotalPages();
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    } else {
        paginationContainer.style.display = 'flex';
    }
    
    let paginationHTML = `
        <button data-action="prev" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Generate page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page if not included
    if (startPage > 1) {
        paginationHTML += `<button data-action="page">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button data-action="page" ${i === currentPage ? 'class="active"' : ''}>
                ${i}
            </button>
        `;
    }
    
    // Add last page if not included
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
        paginationHTML += `<button data-action="page">${totalPages}</button>`;
    }
    
    paginationHTML += `
        <button data-action="next" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Get total number of pages
function getTotalPages() {
    return Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
}

// Display a specific page of projects
function displayPage(page) {
    // Grid view container
    const gridContainer = document.getElementById('projects-container');
    // List view container
    const listContainer = document.querySelector('.projects-list');
    
    // Template for grid view
    const gridTemplate = document.getElementById('project-template');
    
    // Hide loading indicator
    document.body.classList.add('loaded');
    
    // Show message if no projects found
    if (filteredProjects.length === 0) {
        const noResultsHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No open-source projects found with the current filters. Try different filters.</p>
            </div>
        `;
        
        gridContainer.innerHTML = noResultsHTML;
        if (listContainer) {
            listContainer.innerHTML = noResultsHTML;
        }
        return;
    }
    
    // Clear containers
    gridContainer.innerHTML = '';
    if (listContainer) {
        listContainer.innerHTML = '';
    }
    
    // Calculate start and end index for current page
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProjects.length);
    
    // Get projects for current page
    const currentPageProjects = filteredProjects.slice(startIndex, endIndex);
    
    // Add each project
    currentPageProjects.forEach(project => {
        // Create grid view element
        const gridElement = createGridViewElement(project, gridTemplate);
        gridContainer.appendChild(gridElement);
        
        // Create list view element if needed
        if (listContainer) {
            const listElement = createListViewElement(project);
            listContainer.appendChild(listElement);
        }
    });
}

// Create a grid view project element
function createGridViewElement(project, template) {
    const element = template.content.cloneNode(true);
    
    // Set project data
    const titleElement = element.querySelector('.project-title');
    titleElement.textContent = project.title;
    
    // Add click handler for opening the preview modal
    titleElement.addEventListener('click', function(e) {
        e.preventDefault();
        openProjectModal(project.id);
    });
    
    element.querySelector('.score-value').textContent = project.score;
    
    // Set description (only if text exists, otherwise leave empty)
    const descriptionElement = element.querySelector('.project-description');
    if (project.text) {
        // Strip HTML tags and get first 150 characters
        const description = project.text.replace(/<[^>]*>/g, '').slice(0, 150) + '...';
        descriptionElement.textContent = description;
    } else {
        // If no description available, hide the description element
        descriptionElement.style.display = 'none';
    }
    
    // Add tags to project
    const tagsContainer = element.querySelector('.project-tags');
    if (project.tags && project.tags.length > 0) {
        project.tags.forEach(tagId => {
            const tagInfo = TAGS.find(t => t.id === tagId);
            if (tagInfo) {
                const tagElement = document.createElement('span');
                tagElement.className = `project-tag tag-${tagId}`;
                tagElement.innerHTML = `<i class="${tagInfo.icon}"></i>${tagInfo.name}`;
                
                // Add click event for tag filtering
                tagElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!activeTags.includes(tagId)) {
                        toggleTag(tagId);
                    }
                });
                
                tagsContainer.appendChild(tagElement);
            }
        });
    }
    
    // Set metadata
    const timeAgo = formatTimeAgo(project.time);
    element.querySelector('.project-time').textContent = timeAgo;
    
    const linkElement = element.querySelector('.project-link');
    linkElement.href = project.url || `https://news.ycombinator.com/item?id=${project.id}`;
    
    // Add timestamp data attribute for filtering
    element.querySelector('.project-card').dataset.time = project.time;
    
    return element;
}

// Create a list view project element
function createListViewElement(project) {
    const element = document.createElement('div');
    element.className = 'project-card-list';
    
    // Project info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'project-info';
    
    // Title
    const title = document.createElement('h2');
    title.className = 'project-title';
    title.textContent = project.title;
    title.addEventListener('click', function() {
        openProjectModal(project.id);
    });
    
    // Description
    const descP = document.createElement('p');
    descP.className = 'project-description';
    
    if (project.text) {
        // Strip HTML tags and get first 150 characters
        const description = project.text.replace(/<[^>]*>/g, '').slice(0, 150) + '...';
        descP.textContent = description;
    } else {
        // If no description available, hide the description element
        descP.style.display = 'none';
    }
    
    // Tags
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'project-tags';
    
    if (project.tags && project.tags.length > 0) {
        project.tags.forEach(tagId => {
            const tagInfo = TAGS.find(t => t.id === tagId);
            if (tagInfo) {
                const tagElement = document.createElement('span');
                tagElement.className = `project-tag tag-${tagId}`;
                tagElement.innerHTML = `<i class="${tagInfo.icon}"></i>${tagInfo.name}`;
                
                // Add click event for tag filtering
                tagElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (!activeTags.includes(tagId)) {
                        toggleTag(tagId);
                    }
                });
                
                tagsContainer.appendChild(tagElement);
            }
        });
    }
    
    // Add elements to info div
    infoDiv.appendChild(title);
    infoDiv.appendChild(descP);
    infoDiv.appendChild(tagsContainer);
    
    // Project meta
    const metaDiv = document.createElement('div');
    metaDiv.className = 'project-meta-list';
    
    // Score
    const score = document.createElement('span');
    score.className = 'project-score';
    score.innerHTML = `<i class="fas fa-star"></i> <span>${project.score}</span>`;
    
    // Time
    const time = document.createElement('span');
    time.className = 'project-time';
    time.textContent = formatTimeAgo(project.time);
    
    // Link
    const link = document.createElement('a');
    link.className = 'project-link';
    link.href = project.url || `https://news.ycombinator.com/item?id=${project.id}`;
    link.target = '_blank';
    link.innerHTML = `View <i class="fas fa-external-link-alt"></i>`;
    
    // Comments count if available
    if (project.descendants !== undefined) {
        const comments = document.createElement('span');
        comments.className = 'project-comments';
        comments.innerHTML = `<i class="fas fa-comment"></i> ${project.descendants}`;
        metaDiv.appendChild(comments);
    }
    
    // Add elements to meta div
    metaDiv.appendChild(score);
    metaDiv.appendChild(time);
    metaDiv.appendChild(link);
    
    // Add to main container
    element.appendChild(infoDiv);
    element.appendChild(metaDiv);
    
    return element;
}

// Format Unix timestamp to "time ago" format
function formatTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Display error message
function displayError() {
    const container = document.getElementById('projects-container');
    document.body.classList.add('loaded');
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>Unable to load projects. Please try again later.</p>
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('preview-modal');
    const closeButton = document.querySelector('.close-modal');
    
    // Close modal when clicking the close button
    closeButton.addEventListener('click', function() {
        closeModal();
    });
    
    // Close modal when clicking outside content
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Open modal with project details
function openProjectModal(projectId) {
    const modal = document.getElementById('preview-modal');
    
    // Show loading state
    document.querySelector('.modal-loading').style.display = 'flex';
    document.querySelector('.modal-details').classList.remove('loaded');
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    
    // Fetch and display project details
    fetchProjectDetails(projectId);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Re-enable scrolling
}

// Fetch project details and comments
async function fetchProjectDetails(projectId) {
    try {
        // Fetch the project item details
        const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${projectId}.json`);
        const project = await response.json();
        
        // Update modal title and metadata
        document.getElementById('modal-title').textContent = project.title || 'Untitled Project';
        document.querySelector('#modal-score span').textContent = project.score || 0;
        document.querySelector('#modal-author span').textContent = project.by || 'Anonymous';
        document.querySelector('#modal-time span').textContent = formatTimeAgo(project.time);
        
        // Set links
        document.getElementById('modal-link').href = project.url || `https://news.ycombinator.com/item?id=${project.id}`;
        document.getElementById('modal-hn-link').href = `https://news.ycombinator.com/item?id=${project.id}`;
        
        // Set description content
        const descriptionEl = document.getElementById('modal-description');
        if (project.text) {
            descriptionEl.innerHTML = project.text; // Use innerHTML as HN API returns HTML
        } else {
            descriptionEl.innerHTML = '<p>No description available for this project.</p>';
        }
        
        // Add tags to modal
        const tags = detectTags(project);
        const tagsContainer = document.getElementById('modal-tags');
        tagsContainer.innerHTML = '';
        
        if (tags && tags.length > 0) {
            tags.forEach(tagId => {
                const tagInfo = TAGS.find(t => t.id === tagId);
                if (tagInfo) {
                    const tagElement = document.createElement('span');
                    tagElement.className = `project-tag tag-${tagId}`;
                    tagElement.innerHTML = `<i class="${tagInfo.icon}"></i>${tagInfo.name}`;
                    tagsContainer.appendChild(tagElement);
                }
            });
        }
        
        // Fetch top comments if they exist
        if (project.kids && project.kids.length > 0) {
            await fetchComments(project.kids.slice(0, 5)); // Get top 5 comments
        } else {
            document.getElementById('comments-container').innerHTML = 
                '<p class="no-comments">No comments available for this project.</p>';
        }
        
        // Hide loading and show content
        document.querySelector('.modal-loading').style.display = 'none';
        document.querySelector('.modal-details').classList.add('loaded');
        
    } catch (error) {
        console.error('Error fetching project details:', error);
        document.querySelector('.modal-loading').style.display = 'none';
        document.getElementById('modal-description').innerHTML = 
            '<p class="error">Failed to load project details. Please try again later.</p>';
        document.querySelector('.modal-details').classList.add('loaded');
    }
}

// Fetch and display comments
async function fetchComments(commentIds) {
    try {
        const commentPromises = commentIds.map(id => 
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(response => response.json())
        );
        
        const comments = await Promise.all(commentPromises);
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '';
        
        const commentTemplate = document.getElementById('comment-template');
        
        comments.forEach(comment => {
            if (!comment || comment.deleted) return; // Skip deleted comments
            
            const commentElement = commentTemplate.content.cloneNode(true);
            
            commentElement.querySelector('.comment-author').textContent = comment.by || 'Anonymous';
            commentElement.querySelector('.comment-time').textContent = formatTimeAgo(comment.time);
            
            // Set comment text (HN API returns HTML)
            const commentText = commentElement.querySelector('.comment-text');
            if (comment.text) {
                commentText.innerHTML = comment.text;
            } else {
                commentText.textContent = '[Comment text unavailable]';
            }
            
            commentsContainer.appendChild(commentElement);
        });
        
        if (commentsContainer.children.length === 0) {
            commentsContainer.innerHTML = '<p class="no-comments">No comments available for this project.</p>';
        }
        
    } catch (error) {
        console.error('Error fetching comments:', error);
        document.getElementById('comments-container').innerHTML = 
            '<p class="error">Failed to load comments. Please try again later.</p>';
    }
}