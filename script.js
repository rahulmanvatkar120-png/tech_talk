const beeModel = document.getElementById("bee-model");
const sections = Array.from(document.querySelectorAll("section"));
const beeSound = document.getElementById("bee-sound");
const soundToggle = document.getElementById("sound-toggle");

let soundEnabled = false;
let audioContext = null;
let oscillator = null;
let gainNode = null;

const createBeeBuzzSound = () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(240, audioContext.currentTime + 0.15);
    osc1.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.15);
    osc2.frequency.linearRampToValueAtTime(400, audioContext.currentTime + 0.3);
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.3);
    
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 12;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfo.start();
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    osc1.start();
    osc2.start();
    
    oscillator = { stop: () => { osc1.stop(); osc2.stop(); lfo.stop(); } };
};

const updateSoundIcon = () => {
    if (soundToggle) {
        soundToggle.innerHTML = soundEnabled 
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
    }
};

if (soundToggle) {
    soundToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!soundEnabled) {
            createBeeBuzzSound();
            soundEnabled = true;
            updateSoundIcon();
        } else {
            if (oscillator) {
                oscillator.stop();
                oscillator = null;
            }
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            soundEnabled = false;
            updateSoundIcon();
        }
    });
}

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

const exploreBtn = document.querySelector('.btn-primary');
const learnMoreBtn = document.querySelector('.btn-secondary');
const getStartedBtn = document.querySelector('.cta-button');

if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
    });
}

if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
        document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
    });
}

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
}

const shiftPositions = [0, -20, 0, 25];
const cameraOrbits = [[90, 90], [-45, 90], [-180, 0], [45, 90]];

const sectionOffsets = sections.map(section => section.offsetTop);
const lastSectionIndex = sections.length - 1;

const interpolate = (start, end, progress) => start + (end - start) * progress;

const getScrollProgress = (scrolly) => {
    for (let i = 0; i < lastSectionIndex; i++) {
        if (
            scrolly >= sectionOffsets[i] &&
            scrolly < sectionOffsets[i + 1]
        ) {
            return (
                i +
                (scrolly - sectionOffsets[i]) /
                (sectionOffsets[i + 1] - sectionOffsets[i])
            );
        }
    }
    return lastSectionIndex;
};

window.addEventListener("scroll", () => {
    const scrollProgress = getScrollProgress(window.scrollY);
    const sectionIndex = Math.floor(scrollProgress);
    const sectionProgress = scrollProgress - sectionIndex;

    const currentShift = interpolate(
        shiftPositions[sectionIndex],
        shiftPositions[sectionIndex + 1] ?? shiftPositions[sectionIndex], 
        sectionProgress
    );

    const currentOrbit = cameraOrbits[sectionIndex].map((val, i) =>
        interpolate(
            val,
            cameraOrbits[sectionIndex + 1]?.[i] ?? val,
            sectionProgress
        )
    );

    beeModel.style.transform = `translateX(${currentShift}%)`;
    beeModel.setAttribute(
        "camera-orbit",
        `${currentOrbit[0]}deg ${currentOrbit[1]}deg`
    );
});

const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

const navLinks = document.querySelectorAll('.nav-link');

const updateActiveNav = () => {
    const scrollPosition = window.scrollY + 100;
    
    sections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLinks[index]) {
                navLinks[index].classList.add('active');
            }
        }
    });
};

window.addEventListener('scroll', updateActiveNav);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;
        const techSelect = document.getElementById('tech');
        const tech = techSelect ? techSelect.options[techSelect.selectedIndex].text : '';
        
        if (!email) {
            alert('Please enter your email');
            return;
        }
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = `
            <span>Sending...</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
        `;
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('http://localhost:3001/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, tech, message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Form submitted:', { name, email, phone, tech, message });
                
                submitBtn.innerHTML = `
                    <span>Request Sent!</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    contactForm.reset();
                }, 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 100) {
        header.style.background = 'rgba(15, 15, 15, 0.95)';
    } else {
        header.style.background = 'rgba(15, 15, 15, 0.8)';
    }
    
    lastScroll = currentScroll;
});

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        sections.forEach((section, index) => {
            sectionOffsets[index] = section.offsetTop;
        });
    }, 250);
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('in-view');
            }
        });
    }, 100);
});
