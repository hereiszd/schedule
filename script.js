class GroupScheduleSystem {
    constructor() {
        this.data = null;
        this.currentTime = new Date();
        this.currentGroup = null;
        this.authenticatedGroups = new Set(); // 存储已通过密码验证的分组
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadData();
    }

    initializeElements() {
        // 基本元素
        this.currentTimeElement = document.getElementById('current-time');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.peopleContainer = document.getElementById('people-container');
        this.inClassCountElement = document.getElementById('in-class-count');
        this.totalPeopleElement = document.getElementById('total-people');
        
        // 分组相关元素
        this.groupsContainer = document.getElementById('groups-container');
        this.mainContent = document.getElementById('main-content');
        this.welcomeMessage = document.getElementById('welcome-message');
        this.currentGroupName = document.getElementById('current-group-name');
        this.currentGroupDescription = document.getElementById('current-group-description');
        this.changeGroupBtn = document.getElementById('change-group');
        
        // 模态框相关元素
        this.passwordModal = document.getElementById('password-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalDescription = document.getElementById('modal-description');
        this.passwordInput = document.getElementById('password-input');
        this.confirmPasswordBtn = document.getElementById('confirm-password');
        this.cancelPasswordBtn = document.getElementById('cancel-password');
        this.passwordError = document.getElementById('password-error');
        this.closeModal = document.querySelector('.close');
        
        this.selectedGroup = null; // 临时存储选中的分组
    }

    setupEventListeners() {
        this.refreshBtn.addEventListener('click', () => {
            this.currentTime = new Date();
            this.updateDisplay();
        });

        this.changeGroupBtn.addEventListener('click', () => {
            this.showGroupSelection();
        });

        // 密码模态框事件
        this.confirmPasswordBtn.addEventListener('click', () => {
            this.verifyPassword();
        });

        this.cancelPasswordBtn.addEventListener('click', () => {
            this.closePasswordModal();
        });

        this.closeModal.addEventListener('click', () => {
            this.closePasswordModal();
        });

        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyPassword();
            }
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.passwordModal) {
                this.closePasswordModal();
            }
        });
    }

    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('网络响应不正常');
            }
            this.data = await response.json();
            this.populateGroups();
            this.startAutoUpdate();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.groupsContainer.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <p>加载数据失败，请检查data.json文件是否存在且格式正确。</p>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
        }
    }

    populateGroups() {
        if (!this.data || !this.data.groups) return;

        this.groupsContainer.innerHTML = '';
        
        this.data.groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            
            if (group.password) {
                groupCard.classList.add('requires-password');
            }
            
            groupCard.innerHTML = `
                <div class="group-name">${group.name}</div>
                <div class="group-description">${group.description}</div>
                <div class="group-password-info">
                    ${group.password ? '🔒 需要密码' : '🔓 公开访问'}
                </div>
            `;
            
            groupCard.addEventListener('click', () => {
                this.selectGroup(group);
            });
            
            this.groupsContainer.appendChild(groupCard);
        });
    }

    selectGroup(group) {
        this.selectedGroup = group;
        
        // 检查是否需要密码
        if (group.password && !this.authenticatedGroups.has(group.id)) {
            this.showPasswordModal(group);
        } else {
            this.accessGroup(group);
        }
    }

    showPasswordModal(group) {
        this.modalTitle.textContent = `访问 ${group.name}`;
        this.modalDescription.textContent = group.description;
        this.passwordInput.value = '';
        this.passwordError.textContent = '';
        this.passwordModal.style.display = 'block';
        this.passwordInput.focus();
    }

    closePasswordModal() {
        this.passwordModal.style.display = 'none';
        this.selectedGroup = null;
    }

    verifyPassword() {
        const enteredPassword = this.passwordInput.value;
        
        if (!this.selectedGroup) {
            this.closePasswordModal();
            return;
        }
        
        if (enteredPassword === this.selectedGroup.password) {
            this.authenticatedGroups.add(this.selectedGroup.id);
            this.accessGroup(this.selectedGroup);
            this.closePasswordModal();
        } else {
            this.passwordError.textContent = '密码错误，请重试';
            this.passwordInput.value = '';
            this.passwordInput.focus();
        }
    }

    accessGroup(group) {
        this.currentGroup = group;
        this.showMainContent();
        this.updateDisplay();
    }

    showMainContent() {
        this.welcomeMessage.classList.add('hidden');
        this.mainContent.classList.remove('hidden');
        
        this.currentGroupName.textContent = this.currentGroup.name;
        this.currentGroupDescription.textContent = this.currentGroup.description;
    }

    showGroupSelection() {
        this.mainContent.classList.add('hidden');
        this.welcomeMessage.classList.remove('hidden');
        this.currentGroup = null;
    }

    startAutoUpdate() {
        // 每分钟更新一次显示
        setInterval(() => {
            this.currentTime = new Date();
            if (this.currentGroup) {
                this.updateDisplay();
            }
        }, 60000);
    }

    updateDisplay() {
        this.updateTimeDisplay();
        
        if (this.currentGroup && this.data) {
            this.updatePeopleDisplay();
            this.updateSummary();
        }
    }

    updateTimeDisplay() {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            weekday: 'long'
        };
        this.currentTimeElement.textContent = this.currentTime.toLocaleDateString('zh-CN', options);
    }

    getPeopleInCurrentGroup() {
        if (!this.data || !this.data.people || !this.currentGroup) return [];
        
        return this.data.people.filter(person => 
            person.groups && person.groups.includes(this.currentGroup.id)
        );
    }

    getCurrentClassForPerson(person) {
        const dayMap = {
            0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 
            4: 'Thursday', 5: 'Friday', 6: 'Saturday',7:'Sunday'
        };
        
        const currentDay = dayMap[this.currentTime.getDay()];
        const currentTimeStr = this.formatTime(this.currentTime);
        
        return person.schedule.find(course => 
            course.day === currentDay && 
            this.isTimeInRange(currentTimeStr, course.startTime, course.endTime)
        ) || null;
    }

    isTimeInRange(currentTime, startTime, endTime) {
        const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const currentTotal = currentHours * 60 + currentMinutes;
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        
        return currentTotal >= startTotal && currentTotal <= endTotal;
    }

    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    updatePeopleDisplay() {
        this.peopleContainer.innerHTML = '';
        
        const peopleInGroup = this.getPeopleInCurrentGroup();
        
        if (peopleInGroup.length === 0) {
            this.peopleContainer.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    该分组暂无成员或数据加载中...
                </div>
            `;
            return;
        }
        
        peopleInGroup.forEach(person => {
            const currentClass = this.getCurrentClassForPerson(person);
            const personCard = this.createPersonCard(person, currentClass);
            this.peopleContainer.appendChild(personCard);
        });
    }

    createPersonCard(person, currentClass) {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        if (currentClass) {
            card.classList.add('in-class');
            card.innerHTML = `
                <div class="person-header">
                    <div class="person-name">${person.name}</div>
                    <div class="status-badge in-class">正在上课</div>
                </div>
                <div class="course-info">
                    <div class="course-name">${currentClass.course}</div>
                    <div class="course-details">
                        <div class="course-time">${currentClass.time}</div>
                        <div class="course-location">${currentClass.location}</div>
                    </div>
                </div>
            `;
        } else {
            card.classList.add('free');
            card.innerHTML = `
                <div class="person-header">
                    <div class="person-name">${person.name}</div>
                    <div class="status-badge free">无课</div>
                </div>
                <div class="free-message">当前时间段没有课程安排</div>
            `;
        }
        
        return card;
    }

    updateSummary() {
        const peopleInGroup = this.getPeopleInCurrentGroup();
        
        if (peopleInGroup.length === 0) {
            this.inClassCountElement.textContent = '0';
            this.totalPeopleElement.textContent = '0';
            return;
        }
        
        let inClassCount = 0;
        
        peopleInGroup.forEach(person => {
            if (this.getCurrentClassForPerson(person)) {
                inClassCount++;
            }
        });
        
        this.inClassCountElement.textContent = inClassCount;
        this.totalPeopleElement.textContent = peopleInGroup.length;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new GroupScheduleSystem();
});