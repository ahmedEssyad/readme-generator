document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        additionalSections: document.getElementById('additionalSections'),
        sectionButtons: document.querySelectorAll('.section-btn'),
        generateBtn: document.getElementById('generateBtn'),
        previewContainer: document.getElementById('previewContainer'),
        preview: document.getElementById('preview'),
        copyBtn: document.getElementById('copyBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        darkModeToggle: document.getElementById('darkModeToggle'),
        templateSelect: document.getElementById('templateSelect'),
        badgeList: document.getElementById('badgeList'),
        addBadge: document.getElementById('addBadge'),
        badgeInput: document.getElementById('badgeInput'),
        tocCheckbox: document.getElementById('tocCheckbox'),
        saveTemplate: document.getElementById('saveTemplate'),
        savedTemplates: document.getElementById('savedTemplates'),
        togglePreview: document.getElementById('togglePreview'),
        helpBtn: document.getElementById('helpBtn') // New help button
    };

    let isRenderedPreview = false;
    let badges = [];
    loadSavedTemplates();
    setupPlaceholders(); // New function for pre-filled examples
    setupRealTimeTips(); // New function for real-time tips

    // Dark mode toggle
    elements.darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Add section
    elements.sectionButtons.forEach(button => {
        button.addEventListener('click', () => addSection(button.dataset.section));
    });

    // Add badge
    elements.addBadge.addEventListener('click', () => {
        const badge = elements.badgeInput.value.trim();
        if (badge) {
            badges.push(badge);
            updateBadgeList();
            elements.badgeInput.value = '';
        }
    });

    // Generate README
    elements.generateBtn.addEventListener('click', generateReadme);

    // Copy to clipboard
    elements.copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.preview.textContent)
            .then(() => alert('README copied to clipboard!'))
            .catch(err => console.error('Failed to copy: ', err));
    });

    // Download README
    elements.downloadBtn.addEventListener('click', () => {
        const blob = new Blob([elements.preview.textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Save template
    elements.saveTemplate.addEventListener('click', saveCurrentTemplate);

    // Load saved template
    elements.savedTemplates.addEventListener('change', loadTemplate);

    // Toggle preview mode
    elements.togglePreview.addEventListener('click', () => {
        isRenderedPreview = !isRenderedPreview;
        elements.togglePreview.textContent = `Switch to ${isRenderedPreview ? 'Raw' : 'Rendered'}`;
        generateReadme();
    });

    // Help button
    elements.helpBtn.addEventListener('click', showHelpModal);

    function setupPlaceholders() {
        document.getElementById('projectName').placeholder = 'e.g., My Awesome Project';
        document.getElementById('description').placeholder = 'e.g., A tool to simplify README creation with a user-friendly interface.';
        document.getElementById('installation').placeholder = 'e.g., npm install my-awesome-project\nOR\nClone the repo and run npm install';
        document.getElementById('usage').placeholder = 'e.g., Run `npm start` to launch the app.\nSee examples at /docs/examples.';
        document.getElementById('badgeInput').placeholder = 'e.g., ![npm](https://img.shields.io/npm/v/my-awesome-project)';
    }

    function setupRealTimeTips() {
        const tipElements = {
            description: document.createElement('small'),
            installation: document.createElement('small'),
            usage: document.createElement('small')
        };

        Object.entries(tipElements).forEach(([id, tip]) => {
            tip.className = 'writing-tip';
            tip.style.color = '#888';
            tip.style.display = 'block';
            tip.style.marginTop = '5px';
            document.getElementById(id).parentNode.appendChild(tip);
            document.getElementById(id).addEventListener('input', (e) => {
                tip.textContent = getWritingTip(id, e.target.value);
            });
        });
    }

    function getWritingTip(section, value) {
        if (!value.trim()) {
            return `Try starting with a brief overview of your ${section}.`;
        }
        if (section === 'description' && value.length < 50) {
            return 'Consider adding more details about what your project does.';
        }
        if (section === 'installation' && !value.includes('npm') && !value.includes('git')) {
            return 'Maybe include a common install command like `npm install` or `git clone`.';
        }
        if (section === 'usage' && !value.includes('`')) {
            return 'Add a code snippet with backticks (`) for clarity.';
        }
        return 'Looks good! Keep it concise and clear.';
    }

    function showHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Writing a Great README</h2>
                <p><strong>Tips:</strong></p>
                <ul>
                    <li><strong>Description:</strong> Explain what your project does and why it’s useful.</li>
                    <li><strong>Installation:</strong> Provide step-by-step instructions (e.g., <code>npm install</code>).</li>
                    <li><strong>Usage:</strong> Show examples with code snippets (use \`\` for inline code).</li>
                    <li><strong>Markdown Basics:</strong> Use # for headings, * for bullets, \`\`\` for code blocks.</li>
                </ul>
                <button id="closeModal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeModal').addEventListener('click', () => modal.remove());
    }

    function addSection(sectionName) {
        if (!document.getElementById(sectionName)) {
            const sectionDiv = createSectionElement(sectionName);
            elements.additionalSections.appendChild(sectionDiv);
        }
    }

    function createSectionElement(sectionName) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.id = sectionName + 'Section';
        
        const label = document.createElement('label');
        label.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1) + ':';
        
        const textarea = document.createElement('textarea');
        textarea.id = sectionName;
        textarea.placeholder = `e.g., ${getSectionPlaceholder(sectionName)}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.backgroundColor = '#f44336';
        removeBtn.style.marginTop = '5px';
        removeBtn.style.padding = '5px 10px';
        removeBtn.style.fontSize = '12px';
        
        removeBtn.addEventListener('click', () => elements.additionalSections.removeChild(div));
        
        div.appendChild(label);
        div.appendChild(textarea);
        div.appendChild(removeBtn);
        return div;
    }

    function getSectionPlaceholder(sectionName) {
        const placeholders = {
            features: 'List key features, e.g., * Fast performance\n* Easy to use',
            technologies: 'e.g., Built with JavaScript, HTML, and CSS.',
            contributing: 'e.g., Fork the repo, submit a PR, follow our code style.',
            tests: 'e.g., Run `npm test` to execute the test suite.',
            license: 'e.g., MIT License - see LICENSE file for details.',
            contact: 'e.g., Reach out at email@example.com or on Twitter @username.'
        };
        return placeholders[sectionName] || `Enter ${sectionName} information`;
    }

    // [Rest of your existing functions like updateBadgeList, generateReadme, etc., remain unchanged]
    function updateBadgeList() {
        elements.badgeList.innerHTML = '';
        badges.forEach((badge, index) => {
            const div = document.createElement('div');
            div.className = 'badge-item';
            div.textContent = badge;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.style.marginLeft = '10px';
            removeBtn.addEventListener('click', () => {
                badges.splice(index, 1);
                updateBadgeList();
            });
            div.appendChild(removeBtn);
            elements.badgeList.appendChild(div);
        });
    }

    function generateReadme() {
        const projectName = document.getElementById('projectName').value;
        const description = document.getElementById('description').value;
        const installation = document.getElementById('installation').value;
        const usage = document.getElementById('usage').value;
        const template = elements.templateSelect.value;

        let readmeContent = `# ${projectName}\n\n`;
        if (badges.length) readmeContent += badges.join(' ') + '\n\n';

        let sections = [];
        if (elements.tocCheckbox.checked) {
            sections.push('toc');
            readmeContent += '## Table of Contents\n';
        }

        if (description) {
            sections.push('description');
            readmeContent += `## Description\n\n${description}\n\n`;
        }

        if (template !== 'minimal') {
            if (installation) {
                sections.push('installation');
                readmeContent += `## Installation\n\n${installation}\n\n`;
            }
            if (usage) {
                sections.push('usage');
                readmeContent += `## Usage\n\n${usage}\n\n`;
            }
        }

        elements.sectionButtons.forEach(button => {
            const sectionName = button.dataset.section;
            const sectionElement = document.getElementById(sectionName);
            if (sectionElement && sectionElement.value) {
                sections.push(sectionName);
                readmeContent += `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${sectionElement.value}\n\n`;
            }
        });

        if (elements.tocCheckbox.checked) {
            const toc = sections.filter(s => s !== 'toc').map(section => 
                `- [${section.charAt(0).toUpperCase() + section.slice(1)}](#${section.toLowerCase().replace(/\s+/g, '-')})`
            ).join('\n');
            readmeContent = readmeContent.replace('## Table of Contents\n', `## Table of Contents\n${toc}\n\n`);
        }

        elements.previewContainer.style.display = 'block';
        elements.preview.innerHTML = isRenderedPreview ? marked.parse(readmeContent) : readmeContent;
        elements.preview.scrollIntoView({ behavior: 'smooth' });
    }

    function saveCurrentTemplate() {
        const templateName = prompt('Enter template name:');
        if (!templateName) return;

        const templateData = {
            projectName: document.getElementById('projectName').value,
            description: document.getElementById('description').value,
            installation: document.getElementById('installation').value,
            usage: document.getElementById('usage').value,
            badges: [...badges],
            sections: {}
        };

        elements.sectionButtons.forEach(button => {
            const section = document.getElementById(button.dataset.section);
            if (section) templateData.sections[button.dataset.section] = section.value;
        });

        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        saved[templateName] = templateData;
        localStorage.setItem('readmeTemplates', JSON.stringify(saved));
        loadSavedTemplates();
    }

    function loadSavedTemplates() {
        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        elements.savedTemplates.innerHTML = '<option value="">Load Saved Template</option>';
        Object.keys(saved).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elements.savedTemplates.appendChild(option);
        });
    }

    function loadTemplate() {
        const name = elements.savedTemplates.value;
        if (!name) return;

        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        const template = saved[name];
        if (!template) return;

        document.getElementById('projectName').value = template.projectName || '';
        document.getElementById('description').value = template.description || '';
        document.getElementById('installation').value = template.installation || '';
        document.getElementById('usage').value = template.usage || '';
        badges = template.badges || [];
        updateBadgeList();

        elements.additionalSections.innerHTML = '';
        Object.entries(template.sections).forEach(([sectionName, value]) => {
            const div = createSectionElement(sectionName);
            div.querySelector('textarea').value = value;
            elements.additionalSections.appendChild(div);
        });
    }
});