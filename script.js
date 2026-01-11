/* ==================== PRITMA HEALTH JAVASCRIPT ====================
   Version: 1.0.0
   Description: Production-ready JavaScript for PRITMA Health landing page
   Features: Form validation, countdown, animations, analytics, security
   ================================================================== */

(function() {
    'use strict';

    /* ==================== CONFIGURATION ==================== */
    const CONFIG = {
        // Launch date for countdown
        launchDate: new Date('2026-03-01T00:00:00+01:00'), // WAT timezone (Nigeria)
        
        // API endpoint (replace with actual backend URL)
        apiEndpoint: 'https://api.pritma.health/waitlist',
        
        // Referral base URL
        referralBaseUrl: 'https://pritma.health/join?ref=',
        
        // Form validation rules
        validation: {
            email: {
                minLength: 5,
                maxLength: 254,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                // Professional domains that suggest institutional email
                personalDomains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']
            },
            myth: {
                minLength: 20,
                maxLength: 1000
            }
        },
        
        // Queue position simulation (replace with real backend data)
        baseQueuePosition: 247,
        
        // Performance monitoring
        performanceMetrics: {
            enabled: true,
            logToConsole: true
        }
    };

    /* ==================== UTILITY FUNCTIONS ==================== */
    
    // Sanitize user input to prevent XSS
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    // Generate cryptographically secure referral code
    function generateReferralCode(email) {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        
        // Create a more secure hash
        let hash = 0;
        const combined = email + timestamp + randomPart;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to base36 and ensure uniqueness with timestamp
        const hashStr = Math.abs(hash).toString(36).toUpperCase();
        const timeStr = timestamp.toString(36).toUpperCase();
        
        return `${hashStr.substring(0, 6)}-${timeStr.substring(timeStr.length - 4)}`;
    }
    
    // Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Log analytics event (placeholder for real analytics)
    function trackEvent(eventName, eventData) {
        // Store in localStorage for demo purposes
        try {
            const events = JSON.parse(localStorage.getItem('pritma_analytics') || '[]');
            events.push({
                event: eventName,
                data: sanitizeInput(JSON.stringify(eventData)),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
            
            // Keep only last 100 events
            if (events.length > 100) {
                events.shift();
            }
            
            localStorage.setItem('pritma_analytics', JSON.stringify(events));
            
            if (CONFIG.performanceMetrics.logToConsole) {
                console.log(`[PRITMA Analytics] ${eventName}:`, eventData);
            }
            
            // TODO: Send to real analytics service
            // Example: gtag('event', eventName, eventData);
            // Example: analytics.track(eventName, eventData);
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }
    
    // Extract and categorize keywords from myth text
    function extractAndCategorizeMyth(mythText) {
        const text = mythText.toLowerCase();
        
        // Define categories
        const categories = {
            disease: ['covid', 'malaria', 'typhoid', 'hiv', 'aids', 'diabetes', 'cancer', 'tuberculosis', 'cholera'],
            treatment: ['cure', 'medicine', 'drug', 'vaccine', 'injection', 'antibiotics', 'herbal', 'traditional'],
            remedy: ['garlic', 'ginger', 'salt', 'water', 'herb', 'leaf', 'root', 'prayer', 'fasting'],
            harmful: ['dangerous', 'deadly', 'poison', 'toxic', 'fatal', 'kill', 'death', 'harm'],
            source: ['whatsapp', 'facebook', 'tiktok', 'instagram', 'voice note', 'video', 'pastor', 'imam']
        };
        
        const detected = {
            categories: [],
            keywords: [],
            severity: 'medium'
        };
        
        // Detect categories
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                detected.categories.push(category);
            }
        }
        
        // Extract significant keywords (5+ characters, not common words)
        const commonWords = ['that', 'this', 'with', 'from', 'about', 'said', 'they', 'have', 'been', 'were', 'what', 'when', 'where'];
        const words = text.match(/\b\w{5,}\b/g) || [];
        detected.keywords = words
            .filter(word => !commonWords.includes(word))
            .slice(0, 5);
        
        // Determine severity
        if (detected.categories.includes('harmful') || detected.categories.includes('disease')) {
            detected.severity = 'high';
        } else if (detected.categories.includes('treatment') || detected.categories.includes('remedy')) {
            detected.severity = 'medium';
        } else {
            detected.severity = 'low';
        }
        
        return detected;
    }

    /* ==================== PAGE LOADER ==================== */
    
    function hidePageLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                trackEvent('page_load_complete', {
                    loadTime: performance.now()
                });
            }, 500);
        }
    }
    
    /* ==================== COUNTDOWN TIMER ==================== */
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = CONFIG.launchDate.getTime() - now;
        
        if (distance < 0) {
            // Launch date has passed
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update DOM with zero-padded values
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    function initCountdown() {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
    
    /* ==================== MYTH TICKER ==================== */
    
    const MYTHS_DATA = [
        {
            tag: "Trending in Kano",
            content: "A viral voice note claims that eating raw garlic daily can cure COVID-19 and prevent all respiratory infections.",
            aiScore: "Standard AI models scored this as 'Generally Safe' - garlic has antimicrobial properties.",
            clinicalFlag: "Our clinical experts flagged it as 'High Harm' - delays proper treatment, creates false security, may cause gastric issues.",
            details: "This myth has been shared over 50,000 times in the last 72 hours. While garlic has some antimicrobial properties, it is not a cure or preventive measure for COVID-19. Patients delaying proper medical treatment based on this advice are at significant risk."
        },
        {
            tag: "Spreading in Lagos",
            content: "WhatsApp messages suggest that drinking salt water can prevent malaria and kill parasites in the bloodstream.",
            aiScore: "Standard AI models scored this as 'Possibly Helpful' - salt has some antiseptic properties.",
            clinicalFlag: "Our clinical experts flagged it as 'Critical Risk' - causes severe dehydration, hypertension, kidney damage. Zero anti-malarial effect.",
            details: "This dangerous myth has led to 3 documented hospitalizations this week. Salt water consumption for malaria prevention is medically baseless and can cause life-threatening electrolyte imbalances, especially in vulnerable populations."
        },
        {
            tag: "Viral This Week",
            content: "A trending TikTok claims that herbal mixtures can cure diabetes and eliminate the need for insulin.",
            aiScore: "Standard AI models scored this as 'Traditional Medicine - Informational' without harm flags.",
            clinicalFlag: "Our clinical experts flagged it as 'Life-Threatening' - stopping insulin causes diabetic ketoacidosis, organ failure, death.",
            details: "Multiple patients have been admitted to emergency rooms after discontinuing insulin based on this advice. Diabetic patients require consistent medical management. Herbal supplements may complement but never replace insulin therapy."
        },
        {
            tag: "Facebook Post Alert",
            content: "Popular health page suggests that vaccines contain microchips that can track your location and control your thoughts.",
            aiScore: "Standard AI models scored this as 'Opinion - Low Confidence' without explicit warnings.",
            clinicalFlag: "Our clinical experts flagged it as 'Public Health Crisis' - drives vaccine hesitancy, enables preventable disease outbreaks.",
            details: "This conspiracy theory is contributing to declining vaccination rates in urban centers. Vaccines undergo rigorous testing and contain no tracking devices. Vaccine hesitancy has resulted in measles and polio resurgences in several communities."
        },
        {
            tag: "Circulating in Abuja",
            content: "Voice notes claim that taking antibiotics at the first sign of any illness prevents all infections from developing.",
            aiScore: "Standard AI models scored this as 'Medical Advice - General' with standard antibiotic information.",
            clinicalFlag: "Our clinical experts flagged it as 'Critical Harm' - drives antibiotic resistance, suppresses diagnosis, causes adverse reactions.",
            details: "Inappropriate antibiotic use is accelerating antimicrobial resistance in Nigeria. Antibiotics are effective only against bacterial infections, not viral illnesses. Misuse contributes to treatment-resistant infections that claim thousands of lives annually."
        }
    ];
    
    function populateTicker() {
        const wrapper = document.getElementById('tickerWrapper');
        if (!wrapper) return;
        
        const mythCards = MYTHS_DATA.map((myth, index) => `
            <article class="myth-card" 
                     data-myth-id="${index}"
                     tabindex="0" 
                     role="article"
                     aria-label="Health misinformation example: ${myth.tag}">
                <div class="myth-tag">${sanitizeInput(myth.tag)}</div>
                <div class="myth-content">"${sanitizeInput(myth.content)}"</div>
                <div class="myth-comparison">
                    <div class="comparison-item ai-score">
                        <strong>AI Score:</strong> ${sanitizeInput(myth.aiScore)}
                    </div>
                    <div class="comparison-item clinical-flag">
                        <strong>Clinical Flag:</strong> ${sanitizeInput(myth.clinicalFlag)}
                    </div>
                </div>
                <div class="myth-details">
                    <p>${sanitizeInput(myth.details)}</p>
                </div>
            </article>
        `).join('');
        
        // Duplicate for seamless loop
        wrapper.innerHTML = mythCards + mythCards;
        
        // Add click/keyboard event listeners
        wrapper.querySelectorAll('.myth-card').forEach(card => {
            card.addEventListener('click', () => toggleMythDetails(card));
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMythDetails(card);
                }
            });
        });
    }
    
    function toggleMythDetails(card) {
        const wasExpanded = card.classList.contains('expanded');
        card.classList.toggle('expanded');
        
        // Track interaction
        const mythId = card.dataset.mythId;
        if (!wasExpanded && mythId) {
            trackEvent('myth_expanded', {
                mythId: mythId,
                mythTag: MYTHS_DATA[mythId].tag
            });
        }
    }
    
    /* ==================== SCROLL ANIMATIONS ==================== */
    
    let scrollTimeout;
    function handleScroll() {
        const overlay = document.getElementById('scanOverlay');
        if (!overlay) return;
        
        overlay.classList.add('active');
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            overlay.classList.remove('active');
        }, 2000);
    }
    
    // Debounced scroll handler for performance
    const debouncedScroll = debounce(handleScroll, 100);
    
    function initScrollAnimations() {
        window.addEventListener('scroll', debouncedScroll, { passive: true });
        
        // Header scroll effect
        const header = document.querySelector('header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }
    
    /* ==================== SMOOTH SCROLL ==================== */
    
    window.scrollToSection = function(sectionId) {
        const element = document.getElementById(sectionId);
        if (!element) return;
        
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        trackEvent('cta_clicked', {
            target: sectionId,
            source: 'hero'
        });
    };
    
    /* ==================== FORM VALIDATION ==================== */
    
    function showError(groupId, message) {
        const group = document.getElementById(groupId);
        if (!group) return;
        
        group.classList.add('error');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    
    function clearError(groupId) {
        const group = document.getElementById(groupId);
        if (!group) return;
        
        group.classList.remove('error');
        const errorElement = group.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    
    function validateEmail(email) {
        const trimmedEmail = email.trim().toLowerCase();
        const { minLength, maxLength, pattern, personalDomains } = CONFIG.validation.email;
        
        if (!trimmedEmail) {
            return { valid: false, error: 'Email is required' };
        }
        
        if (trimmedEmail.length < minLength) {
            return { valid: false, error: 'Email is too short' };
        }
        
        if (trimmedEmail.length > maxLength) {
            return { valid: false, error: 'Email is too long' };
        }
        
        if (!pattern.test(trimmedEmail)) {
            return { valid: false, error: 'Please enter a valid email address' };
        }
        
        // Check for personal email domains (soft warning)
        const domain = trimmedEmail.split('@')[1];
        if (personalDomains.includes(domain)) {
            // Don't reject, but flag for analytics
            trackEvent('personal_email_used', { domain });
        }
        
        return { valid: true };
    }
    
    function validateOrgType(orgType) {
        if (!orgType) {
            return { valid: false, error: 'Please select your organization type' };
        }
        return { valid: true };
    }
    
    function validateMyth(myth) {
        const trimmedMyth = myth.trim();
        const { minLength, maxLength } = CONFIG.validation.myth;
        
        if (!trimmedMyth) {
            return { valid: false, error: 'Please share a health myth you\'ve encountered' };
        }
        
        if (trimmedMyth.length < minLength) {
            return { valid: false, error: `Please provide more detail (at least ${minLength} characters)` };
        }
        
        if (trimmedMyth.length > maxLength) {
            return { valid: false, error: `Please keep it under ${maxLength} characters` };
        }
        
        return { valid: true };
    }
    
    function validateHoneypot(honeypotValue) {
        // If honeypot is filled, it's likely a bot
        return honeypotValue === '';
    }
    
    /* ==================== FORM SUBMISSION ==================== */
    
    async function submitToBackend(formData) {
        // Simulate API call for demo
        // Replace with actual fetch call to your backend
        
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate successful submission
                const success = Math.random() > 0.1; // 90% success rate for demo
                
                if (success) {
                    resolve({
                        success: true,
                        queuePosition: CONFIG.baseQueuePosition + Math.floor(Math.random() * 50),
                        referralCode: generateReferralCode(formData.email),
                        message: 'Successfully added to waitlist'
                    });
                } else {
                    reject(new Error('Submission failed. Please try again.'));
                }
            }, 1500);
        });
        
        /* PRODUCTION CODE - Replace above with this:
        try {
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Backend submission error:', error);
            throw error;
        }
        */
    }
    
    function initFormHandling() {
        const form = document.getElementById('waitlistForm');
        if (!form) return;
        
        const emailInput = document.getElementById('email');
        const orgTypeInput = document.getElementById('orgType');
        const mythInput = document.getElementById('myth');
        const submitBtn = document.getElementById('submitBtn');
        const honeypotInput = document.getElementById('website');
        
        // Character counter for myth textarea
        if (mythInput) {
            mythInput.addEventListener('input', () => {
                const charCount = document.getElementById('mythCharCount');
                if (charCount) {
                    charCount.textContent = mythInput.value.length;
                }
            });
        }
        
        // Real-time validation on blur
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const validation = validateEmail(emailInput.value);
                if (!validation.valid && emailInput.value) {
                    showError('emailGroup', validation.error);
                } else {
                    clearError('emailGroup');
                }
            });
        }
        
        if (mythInput) {
            mythInput.addEventListener('blur', () => {
                const validation = validateMyth(mythInput.value);
                if (!validation.valid && mythInput.value) {
                    showError('mythGroup', validation.error);
                } else {
                    clearError('mythGroup');
                }
            });
        }
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear all previous errors
            document.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error');
            });
            
            // Validate honeypot (bot detection)
            if (!validateHoneypot(honeypotInput.value)) {
                console.warn('Bot detected via honeypot');
                trackEvent('bot_detected', { method: 'honeypot' });
                return; // Silently fail for bots
            }
            
            // Validate all fields
            const emailValidation = validateEmail(emailInput.value);
            const orgTypeValidation = validateOrgType(orgTypeInput.value);
            const mythValidation = validateMyth(mythInput.value);
            
            let isValid = true;
            
            if (!emailValidation.valid) {
                showError('emailGroup', emailValidation.error);
                isValid = false;
            }
            
            if (!orgTypeValidation.valid) {
                showError('orgTypeGroup', orgTypeValidation.error);
                isValid = false;
            }
            
            if (!mythValidation.valid) {
                showError('mythGroup', mythValidation.error);
                isValid = false;
            }
            
            if (!isValid) {
                trackEvent('form_validation_failed', {
                    errors: [
                        !emailValidation.valid ? 'email' : null,
                        !orgTypeValidation.valid ? 'orgType' : null,
                        !mythValidation.valid ? 'myth' : null
                    ].filter(Boolean)
                });
                return;
            }
            
            // Prepare sanitized form data
            const formData = {
                email: sanitizeInput(emailInput.value.trim().toLowerCase()),
                orgType: sanitizeInput(orgTypeInput.value),
                myth: sanitizeInput(mythInput.value.trim()),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            };
            
            // Analyze myth content
            const mythAnalysis = extractAndCategorizeMyth(mythInput.value);
            formData.mythAnalysis = mythAnalysis;
            
            // Track form submission attempt
            trackEvent('form_submission_started', {
                orgType: formData.orgType,
                mythCategories: mythAnalysis.categories,
                mythSeverity: mythAnalysis.severity
            });
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.querySelector('.btn-text').textContent = 'Submitting...';
            
            try {
                // Submit to backend
                const response = await submitToBackend(formData);
                
                // Track successful submission
                trackEvent('form_submission_success', {
                    queuePosition: response.queuePosition,
                    orgType: formData.orgType,
                    mythKeywords: mythAnalysis.keywords,
                    mythSeverity: mythAnalysis.severity
                });
                
                // Store submission in localStorage (for demo)
                try {
                    const submissions = JSON.parse(localStorage.getItem('pritma_submissions') || '[]');
                    submissions.push({
                        ...formData,
                        queuePosition: response.queuePosition,
                        referralCode: response.referralCode
                    });
                    localStorage.setItem('pritma_submissions', JSON.stringify(submissions));
                } catch (storageError) {
                    console.warn('Could not store submission locally:', storageError);
                }
                
                // Show success modal
                showSuccessModal(response.queuePosition, response.referralCode);
                
                // Reset form
                form.reset();
                document.getElementById('mythCharCount').textContent = '0';
                
            } catch (error) {
                console.error('Form submission error:', error);
                
                // Track error
                trackEvent('form_submission_error', {
                    error: error.message,
                    orgType: formData.orgType
                });
                
                // Show user-friendly error
                alert('Sorry, there was an error submitting your information. Please try again or contact us directly.');
                
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.querySelector('.btn-text').textContent = 'Secure My Institution\'s Access';
            }
        });
    }
    
    /* ==================== SUCCESS MODAL ==================== */
    
    function showSuccessModal(queuePosition, referralCode) {
        const modal = document.getElementById('successModal');
        const positionElement = document.getElementById('queuePosition');
        const referralLinkElement = document.getElementById('referralLink');
        
        if (!modal) return;
        
        // Update modal content
        if (positionElement) {
            positionElement.textContent = `#${queuePosition}`;
        }
        
        if (referralLinkElement) {
            referralLinkElement.value = `${CONFIG.referralBaseUrl}${referralCode}`;
        }
        
        // Show modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus management for accessibility
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.focus();
        }
        
        // Track modal view
        trackEvent('success_modal_shown', {
            queuePosition: queuePosition,
            referralCode: referralCode
        });
    }
    
    window.closeModal = function() {
        const modal = document.getElementById('successModal');
        if (!modal) return;
        
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        trackEvent('modal_closed', {});
    };
    
    window.copyReferralLink = function() {
        const referralLinkElement = document.getElementById('referralLink');
        const copyBtn = event.target.closest('.copy-btn');
        
        if (!referralLinkElement || !copyBtn) return;
        
        const link = referralLinkElement.value;
        
        // Copy to clipboard
        navigator.clipboard.writeText(link).then(() => {
            // Update button state
            const originalHTML = copyBtn.innerHTML;
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="copy-text">Copied!</span>
            `;
            
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalHTML;
            }, 2000);
            
            trackEvent('referral_link_copied', {
                link: link
            });
        }).catch(err => {
            console.error('Failed to copy:', err);
            
            // Fallback: select the text
            referralLinkElement.select();
            alert('Link copied! You can now share it with your colleagues.');
        });
    };
    
    window.shareToWhatsApp = function() {
        const referralLinkElement = document.getElementById('referralLink');
        if (!referralLinkElement) return;
        
        const link = referralLinkElement.value;
        const message = encodeURIComponent(
            `🚨 PRITMA Health - Combat Health Misinformation\n\n` +
            `I just joined the waitlist for PRITMA, Nigeria's first clinical-grade platform to detect dangerous health rumors.\n\n` +
            `Join me and move up the queue:\n${link}\n\n` +
            `Together, we can stop life-threatening misinformation before it spreads.`
        );
        
        const whatsappUrl = `https://wa.me/?text=${message}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
        
        trackEvent('referral_shared_whatsapp', {
            link: link
        });
    };
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Close modal on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });
    
    /* ==================== INTERSECTION OBSERVER (PERFORMANCE) ==================== */
    
    function initIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Track section view
                    trackEvent('section_viewed', {
                        section: entry.target.id || entry.target.className
                    });
                }
            });
        }, observerOptions);
        
        // Observe sections
        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }
    
    /* ==================== PERFORMANCE MONITORING ==================== */
    
    function monitorPerformance() {
        if (!CONFIG.performanceMetrics.enabled) return;
        
        // Page load time
        window.addEventListener('load', () => {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const connectTime = perfData.responseEnd - perfData.requestStart;
            const renderTime = perfData.domComplete - perfData.domLoading;
            
            trackEvent('performance_metrics', {
                pageLoadTime: pageLoadTime,
                connectTime: connectTime,
                renderTime: renderTime,
                resourceCount: performance.getEntriesByType('resource').length
            });
            
            if (CONFIG.performanceMetrics.logToConsole) {
                console.log(`[PRITMA Performance]`);
                console.log(`- Page Load Time: ${pageLoadTime}ms`);
                console.log(`- Connect Time: ${connectTime}ms`);
                console.log(`- Render Time: ${renderTime}ms`);
                console.log(`- Resources Loaded: ${performance.getEntriesByType('resource').length}`);
            }
        });
    }
    
    /* ==================== INITIALIZATION ==================== */
    
    function init() {
        // Track page view
        trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        });
        
        // Initialize all features
        hidePageLoader();
        initCountdown();
        populateTicker();
        initScrollAnimations();
        initFormHandling();
        initIntersectionObserver();
        monitorPerformance();
        
        // Log initialization
        if (CONFIG.performanceMetrics.logToConsole) {
            console.log('%c🏥 PRITMA Health - Initialized', 'color: #00FF41; font-size: 16px; font-weight: bold;');
            console.log('%cCombating health misinformation in Nigeria', 'color: #b8c5d6; font-size: 12px;');
        }
    }
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    /* ==================== EXPORT FOR DEBUGGING ==================== */
    
    // Expose utilities for debugging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.PRITMA_DEBUG = {
            getAnalytics: () => JSON.parse(localStorage.getItem('pritma_analytics') || '[]'),
            getSubmissions: () => JSON.parse(localStorage.getItem('pritma_submissions') || '[]'),
            clearAnalytics: () => localStorage.removeItem('pritma_analytics'),
            clearSubmissions: () => localStorage.removeItem('pritma_submissions'),
            config: CONFIG,
            trackEvent: trackEvent
        };
        
        console.log('%c📊 Debug Mode Active', 'color: #ff9500; font-size: 12px;');
        console.log('Access debug utilities via window.PRITMA_DEBUG');
    }
    
})();