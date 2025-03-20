class ReadmeGenerator {
    constructor() {
        this.elements = {
            form: document.getElementById('readmeForm'),
            preview: document.getElementById('preview'),
            previewContainer: document.getElementById('previewContainer'),
            badgeList: document.getElementById('badgeList'),
            additionalSections: document.getElementById('additionalSections'),
            alertBox: document.getElementById('alertBox'),
            templateSelect: document.getElementById('templateSelect'),
            projectName: document.getElementById('projectName'),
            description: document.getElementById('description'),
            installation: document.getElementById('installation'),
            usage: document.getElementById('usage'),
            badgeInput: document.getElementById('badgeInput'),
            badgePicker: document.getElementById('badgePicker'),
            tocCheckbox: document.getElementById('tocCheckbox'),
            savedTemplates: document.getElementById('savedTemplates'),
            settingsModal: document.getElementById('settingsModal'),
            helpModal: document.getElementById('helpModal'),
        };
        this.badges = [];
        this.isRenderedPreview = false;
        this.isGithubStyle = false;
        this.debounceTimeout = null;
        this.settings = { defaultTemplate: 'detailed', previewFontSize: 16, autoSave: false };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedTemplates();
        this.setupPlaceholders();
        this.setupRealTimePreview();
        this.makeSectionsDraggable();
        this.loadSettings();
    }

    bindEvents() {
        this.elements.form.addEventListener('input', () => this.debounce(this.generateReadme.bind(this), 300));
        document.getElementById('generateBtn').addEventListener('click', () => this.validateAndGenerate());
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());
        document.getElementById('sampleReadme').addEventListener('click', () => this.loadSampleReadme());
        document.getElementById('addBadge').addEventListener('click', () => this.addBadge());
        document.getElementById('togglePreview').addEventListener('click', () => this.togglePreviewMode());
        document.getElementById('githubPreview').addEventListener('click', () => this.toggleGithubStyle());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('downloadMdBtn').addEventListener('click', () => this.downloadMarkdown());
        document.getElementById('downloadPdfBtn').addEventListener('click', () => this.downloadPdf());
        document.getElementById('saveTemplate').addEventListener('click', () => this.saveCurrentTemplate());
        document.getElementById('savedTemplates').addEventListener('change', () => this.loadTemplate());
        document.getElementById('darkModeToggle').addEventListener('click', () => document.body.classList.toggle('dark-mode'));
        document.getElementById('highContrastToggle').addEventListener('click', () => document.body.classList.toggle('high-contrast'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelpModal());
        document.querySelectorAll('.section-btn').forEach(btn => btn.addEventListener('click', () => this.addSection(btn.dataset.section)));
    }

    /** @description Debounces a function to limit execution rate */
    debounce(func, delay) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, delay);
    }

    /** @description Generates README content and updates preview */
    generateReadme() {
        const data = this.getFormData();
        let content = `# ${data.projectName}\n\n`;
        if (this.badges.length) content += this.badges.join(' ') + '\n\n';

        let sections = [];
        if (data.toc) {
            sections.push('toc');
            content += '## Table of Contents\n';
        }
        if (data.description) {
            sections.push('description');
            content += `## Description\n\n${data.description}\n\n`;
        }
        if (data.template !== 'minimal') {
            if (data.installation) {
                sections.push('installation');
                content += `## Installation\n\n${data.installation}\n\n`;
            }
            if (data.usage) {
                sections.push('usage');
                content += `## Usage\n\n${data.usage}\n\n`;
            }
        }

        const additionalSections = Array.from(this.elements.additionalSections.children);
        additionalSections.forEach(section => {
            const sectionName = section.id.replace('Section', '');
            const value = section.querySelector('textarea').value;
            if (value) {
                sections.push(sectionName);
                content += `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${value}\n\n`;
            }
        });

        if (data.toc) {
            const toc = sections.filter(s => s !== 'toc').map(section => 
                `- [${section.charAt(0).toUpperCase() + section.slice(1)}](#${section.toLowerCase().replace(/\s+/g, '-')})`
            ).join('\n');
            content = content.replace('## Table of Contents\n', `## Table of Contents\n${toc}\n\n`);
        }

        this.elements.previewContainer.style.display = 'block';
        this.elements.preview.className = `preview ${this.isGithubStyle ? 'github-style' : ''}`;
        this.elements.preview.style.fontSize = `${this.settings.previewFontSize}px`;
        this.elements.preview.innerHTML = this.isRenderedPreview ? marked.parse(content) : content;
        if (this.settings.autoSave) this.autoSave();
    }

    validateAndGenerate() {
        const projectName = this.elements.projectName.value.trim();
        if (!projectName) {
            this.showAlert('Project Name is required.', 'error');
            return;
        }
        this.generateReadme();
    }

    resetForm() {
        this.elements.form.reset();
        this.badges = [];
        this.elements.badgeList.innerHTML = '';
        this.elements.additionalSections.innerHTML = '';
        this.elements.previewContainer.style.display = 'none';
    }

    addBadge() {
        const picker = this.elements.badgePicker.value;
        const custom = this.elements.badgeInput.value.trim();
        const badge = picker || custom;
        if (badge) {
            this.badges.push(badge);
            this.updateBadgeList();
            this.elements.badgeInput.value = '';
            this.elements.badgePicker.value = '';
            this.generateReadme();
        }
    }

    updateBadgeList() {
        this.elements.badgeList.innerHTML = '';
        this.badges.forEach((badge, index) => {
            const div = document.createElement('div');
            div.className = 'badge-item';
            div.textContent = badge;
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'x';
            removeBtn.className = 'btn btn-danger';
            removeBtn.addEventListener('click', () => {
                this.badges.splice(index, 1);
                this.updateBadgeList();
                this.generateReadme();
            });
            div.appendChild(removeBtn);
            this.elements.badgeList.appendChild(div);
        });
    }

    makeSectionsDraggable() {
        new Sortable(this.elements.additionalSections, {
            animation: 150,
            handle: '.badge-item',
            onEnd: () => this.generateReadme(),
        });
    }

    copyToClipboard() {
        navigator.clipboard.writeText(this.elements.preview.textContent)
            .then(() => this.showAlert('Copied to clipboard!', 'success'))
            .catch(() => this.showAlert('Failed to copy to clipboard.', 'error'));
    }

    downloadMarkdown() {
        const blob = new Blob([this.elements.preview.textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadPdf() {
        const element = this.elements.preview;
        html2pdf().from(element).set({ margin: 1, filename: 'README.pdf' }).save();
    }

    showAlert(message, type) {
        this.elements.alertBox.textContent = message;
        this.elements.alertBox.style.display = 'flex';
        this.elements.alertBox.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.elements.alertBox.style.display = 'none');
        this.elements.alertBox.appendChild(closeBtn);
        setTimeout(() => this.elements.alertBox.style.display = 'none', 5000);
    }

    loadSampleReadme() {
        this.elements.projectName.value = 'Sample Project';
        this.elements.description.value = 'A sample project to demonstrate README generation.';
        this.elements.installation.value = 'npm install sample-project';
        this.elements.usage.value = 'Run `npm start` to begin.';
        this.badges = ['![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)'];
        this.updateBadgeList();
        this.generateReadme();
    }

    setupPlaceholders() {
        this.elements.projectName.placeholder = 'e.g., My Awesome Project';
        this.elements.description.placeholder = 'e.g., A tool to simplify README creation';
        this.elements.installation.placeholder = 'e.g., npm install my-awesome-project';
        this.elements.usage.placeholder = 'e.g., Run `npm start` to launch';
        this.elements.badgeInput.placeholder = 'e.g., ![npm](https://img.shields.io/npm/v/my-awesome-project)';
    }

    setupRealTimePreview() {
        [this.elements.projectName, this.elements.description, this.elements.installation, this.elements.usage]
            .forEach(el => el.addEventListener('input', () => this.debounce(this.generateReadme.bind(this), 300)));
    }

    addSection(sectionName) {
        if (!document.getElementById(sectionName)) {
            const sectionDiv = this.createSectionElement(sectionName);
            this.elements.additionalSections.appendChild(sectionDiv);
            sectionDiv.querySelector('textarea').addEventListener('input', () => this.generateReadme());
        }
    }

    createSectionElement(sectionName) {
        const div = document.createElement('div');
        div.className = 'form-group badge-item';
        div.id = sectionName + 'Section';
        const label = document.createElement('label');
        label.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1) + ':';
        const textarea = document.createElement('textarea');
        textarea.id = sectionName;
        textarea.placeholder = this.getSectionPlaceholder(sectionName);
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'btn btn-danger';
        removeBtn.addEventListener('click', () => {
            this.elements.additionalSections.removeChild(div);
            this.generateReadme();
        });
        div.appendChild(label);
        div.appendChild(textarea);
        div.appendChild(removeBtn);
        return div;
    }

    getSectionPlaceholder(sectionName) {
        const placeholders = {
            features: 'e.g., * Fast performance\n* Easy to use',
            technologies: 'e.g., Built with JavaScript, HTML, and CSS',
            contributing: 'e.g., Fork the repo, submit a PR',
            tests: 'e.g., Run `npm test` to execute tests',
            license: 'e.g., MIT License - see LICENSE file',
            contact: 'e.g., email@example.com'
        };
        return placeholders[sectionName] || `Enter ${sectionName} details`;
    }

    saveCurrentTemplate() {
        const templateName = prompt('Enter template name:');
        if (!templateName) return;
        const templateData = this.getFormData();
        templateData.badges = [...this.badges];
        templateData.sections = {};
        this.elements.additionalSections.children.forEach(section => {
            const sectionName = section.id.replace('Section', '');
            templateData.sections[sectionName] = section.querySelector('textarea').value;
        });
        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        saved[templateName] = templateData;
        localStorage.setItem('readmeTemplates', JSON.stringify(saved));
        this.loadSavedTemplates();
    }

    loadSavedTemplates() {
        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        this.elements.savedTemplates.innerHTML = '<option value="">Load Saved Template</option>';
        Object.keys(saved).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.elements.savedTemplates.appendChild(option);
        });
    }

    loadTemplate() {
        const name = this.elements.savedTemplates.value;
        if (!name) return;
        const saved = JSON.parse(localStorage.getItem('readmeTemplates') || '{}');
        const template = saved[name];
        if (!template) return;
        this.elements.projectName.value = template.projectName || '';
        this.elements.description.value = template.description || '';
        this.elements.installation.value = template.installation || '';
        this.elements.usage.value = template.usage || '';
        this.badges = template.badges || [];
        this.updateBadgeList();
        this.elements.additionalSections.innerHTML = '';
        Object.entries(template.sections).forEach(([sectionName, value]) => {
            const div = this.createSectionElement(sectionName);
            div.querySelector('textarea').value = value;
            this.elements.additionalSections.appendChild(div);
        });
        this.generateReadme();
    }

    getFormData() {
        return {
            template: this.elements.templateSelect.value,
            projectName: this.elements.projectName.value,
            description: this.elements.description.value,
            installation: this.elements.installation.value,
            usage: this.elements.usage.value,
            toc: this.elements.tocCheckbox.checked,
        };
    }

    togglePreviewMode() {
        this.isRenderedPreview = !this.isRenderedPreview;
        document.getElementById('togglePreview').textContent = `Switch to ${this.isRenderedPreview ? 'Raw' : 'Rendered'}`;
        this.generateReadme();
    }

    toggleGithubStyle() {
        this.isGithubStyle = !this.isGithubStyle;
        document.getElementById('githubPreview').textContent = this.isGithubStyle ? 'Default Style' : 'GitHub Style';
        this.generateReadme();
    }

    showSettings() {
        this.elements.settingsModal.style.display = 'flex';
        document.getElementById('defaultTemplate').value = this.settings.defaultTemplate;
        document.getElementById('previewFontSize').value = this.settings.previewFontSize;
        document.getElementById('autoSave').checked = this.settings.autoSave;
    }

    saveSettings() {
        this.settings.defaultTemplate = document.getElementById('defaultTemplate').value;
        this.settings.previewFontSize = parseInt(document.getElementById('previewFontSize').value);
        this.settings.autoSave = document.getElementById('autoSave').checked;
        localStorage.setItem('readmeSettings', JSON.stringify(this.settings));
        this.elements.settingsModal.style.display = 'none';
        this.generateReadme();
    }

    loadSettings() {
        const saved = JSON.parse(localStorage.getItem('readmeSettings'));
        if (saved) this.settings = saved;
        this.elements.templateSelect.value = this.settings.defaultTemplate;
    }

    autoSave() {
        const autoSaveData = this.getFormData();
        autoSaveData.badges = [...this.badges];
        localStorage.setItem('readmeAutoSave', JSON.stringify(autoSaveData));
    }

    showHelpModal() {
        this.elements.helpModal.style.display = 'flex';
        const content = this.elements.helpModal.querySelector('#helpContent');
        const tabs = this.elements.helpModal.querySelectorAll('.tab-btn');
        const helpContent = {
            'getting-started': `
                <h3>Getting Started</h3>
                <p>Fill in the fields to create your README. Use the "Generate README" button to preview, then copy or download.</p>
            `,
            'markdown-tips': `
                <h3>Markdown Tips</h3>
                <ul>
                    <li><strong># Heading</strong> - Use # for headings</li>
                    <li><strong>* Item</strong> - Use * for bullets</li>
                    <li><strong>\`\`\`code\`\`\`</strong> - Use triple backticks for code blocks</li>
                </ul>
            `,
            'faq': `
                <h3>FAQ</h3>
                <p><strong>Q:</strong> Can I save my work?<br><strong>A:</strong> Yes, use "Save Template" or enable auto-save in settings.</p>
            `
        };

        const showTab = (tab) => {
            content.innerHTML = helpContent[tab];
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        };

        tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
        showTab('getting-started');
        document.getElementById('closeHelp').addEventListener('click', () => this.elements.helpModal.style.display = 'none');
    }
}

document.addEventListener('DOMContentLoaded', () => new ReadmeGenerator());

