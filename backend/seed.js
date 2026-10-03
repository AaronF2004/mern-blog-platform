const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');

const samplePosts = [
  // --- 1. Information Technology ---
  {
    title: 'Migrating Legacy Monoliths to Microservices Architecture',
    author: 'Aarav Sharma',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    content: 'Deconstructing legacy enterprise monolithic applications requires domain-driven design, isolated data boundaries, and event-driven communication via message brokers like Apache Kafka and RabbitMQ.',
    likes: 0
  },
  {
    title: 'Zero Trust Network Architecture for Cloud Environments',
    author: 'Rohan Deshmukh',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    content: 'The perimeter-based security model is obsolete. Modern zero-trust architecture enforces continuous identity verification, least-privilege role access, and end-to-end encrypted packet transmission.',
    likes: 0
  },
  {
    title: 'Automating CI/CD Pipelines Using GitHub Actions and Docker',
    author: 'Kunal Verma',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    content: 'Setting up automated multi-stage test runners, image build triggers, and deployment pipelines ensures zero-downtime releases and rapid bug mitigation cycles across production nodes.',
    likes: 0
  },
  {
    title: 'Edge Computing and CDN Optimization Strategies',
    author: 'Neha Kulkarni',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    content: 'Pushing compute execution closer to edge locations using distributed worker engines minimizes latency for latency-sensitive web apps, streaming pipelines, and real-time multiplayer sockets.',
    likes: 0
  },

  // --- 2. Artificial Intelligence ---
  {
    title: 'Fine-Tuning Open Source LLMs for Specialized Domains',
    author: 'Siddharth Nair',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    content: 'LoRA and parameter-efficient fine-tuning allow engineers to tailor generalized models for legal, financial, and code reasoning tasks with minimal hardware overhead.',
    likes: 0
  },
  {
    title: 'Reinforcement Learning from Human Feedback (RLHF) Dynamics',
    author: 'Tanya Dixit',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    content: 'Alignment techniques ensure high-capacity foundation models adhere to human safety guidelines, output constraints, and helpful assistant tones.',
    likes: 0
  },
  {
    title: 'Building Production Retrieval-Augmented Generation (RAG) Systems',
    author: 'Ishaan Gupta',
    category: 'Artificial Intelligence',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjznNlBBvyYMUbiAztM3wlEyHVPW4A6ONqjTFJd116fg&s=10',
    content: 'Vector databases, dense retrieval embedding models, and contextual re-ranking pipelines enable LLMs to synthesize factual, grounded answers without model hallucination.',
    likes: 0
  },
  {
    title: 'Computer Vision in Autonomous Robotics and Navigation',
    author: 'Devika Menon',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    content: 'Real-time spatial mapping using depth cameras, LiDAR fusion, and YOLOv8 neural network architectures allow warehouse robots to navigate dynamic floor layouts without collisions.',
    likes: 0
  },

  // --- 3. Healthcare ---
  {
    title: 'Telemedicine Systems and Remote Patient Vitals Monitoring',
    author: 'Dr. Ananya Roy',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    content: 'Wearable sensors coupled with HIPAA-compliant cloud dashboards allow clinical staff to track electrocardiograms, glucose fluctuations, and oxygen saturation levels in real-time.',
    likes: 0
  },
  {
    title: 'AI-Assisted Diagnostic Imaging for Early Tumor Detection',
    author: 'Dr. Sameer Patel',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    content: 'Convolutional neural networks trained on hundreds of thousands of CT and MRI slices highlight micro-calcifications and anomalous cell densities that escape the human eye.',
    likes: 0
  },
  {
    title: 'CRISPR Gene Editing Innovations in Rare Disease Treatment',
    author: 'Meera Nambiar',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    content: 'Base editing and prime editing variations of CRISPR technologies are providing unprecedented therapeutic cures for sickle cell disease and hereditary blindness.',
    likes: 0
  },
  {
    title: 'Mental Health Informatics: Digital Therapeutics & Cognitive Apps',
    author: 'Priya Sengupta',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    content: 'Evidence-based cognitive behavioral therapy delivered through interactive digital mobile interfaces offers supplemental support for patients managing chronic stress and depression.',
    likes: 0
  },

  // --- 4. Business & Finance ---
  {
    title: 'Algorithmic Trading & High-Frequency Risk Engines',
    author: 'Vikram Sethi',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    content: 'Low-latency C++ order routing engines and statistical arbitrage algorithms analyze book depth and order imbalance across international exchanges in sub-millisecond intervals.',
    likes: 0
  },
  {
    title: 'Decentralized Finance (DeFi) Protocols and Smart Contract Security',
    author: 'Nikhil Bansal',
    category: 'Business & Finance',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjl46cZo7Z5RYhvScXDsO6iaaDfUDhl65eNZq2HgV_HA&s=10',
    content: 'Automated market makers and liquidity pools require formal verification and reentrancy attack mitigation to protect retail capital from liquidity drains.',
    likes: 0
  },
  {
    title: 'Venture Capital Valuation Trends in Tech Startups',
    author: 'Simran Jolly',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    content: 'Shifting from growth-at-all-costs metrics toward net profit margins, unit economics, and customer acquisition efficiency has reset early-stage seed round multiples.',
    likes: 0
  },
  {
    title: 'ESG Investing & Sustainable Corporate Governance Models',
    author: 'Aditya Chawla',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    content: 'Institutional asset managers are demanding verifiable carbon accounting metrics and transparent boardroom accountability standards prior to allocating long-term pension assets.',
    likes: 0
  },

  // --- 5. Engineering & Construction ---
  {
    title: 'Structural Health Monitoring of Long-Span Bridges Using IoT',
    author: 'Pooja Iyer',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    content: 'Piezoelectric vibration sensors and strain gauges attached to suspension cables detect microscopic metal fatigue, helping civil engineers schedule preventative repairs.',
    likes: 0
  },
  {
    title: 'Building Information Modeling (BIM) in High-Rise Architecture',
    author: 'Rajesh Nair',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    content: '3D spatial clash detection and multidisciplinary CAD synchronization allow architects, HVAC installers, and structural engineers to collaborate seamlessly before groundbreaking.',
    likes: 0
  },
  {
    title: 'Pre-Cast Modular Construction and Sustainable Concrete',
    author: 'Harish Varma',
    category: 'Engineering & Construction',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNG87tjvLr9B24FOnlW5TCo1JHHiYVnf2JiiR-HJqthg&s=10',
    content: 'Factory-manufactured precast modules manufactured with low-carbon pozzolanic cement blends accelerate building delivery timetables while slashing material waste.',
    likes: 0
  },
  {
    title: 'Geotechnical Earth Retention Systems for Deep Excavations',
    author: 'Sanjay Rathore',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=800&q=80',
    content: 'Secant pile walls, diaphragm cutoffs, and prestressed tieback anchors provide foundational lateral resistance for multi-level underground parking and transit networks.',
    likes: 0
  },

  // --- 6. Education & Training ---
  {
    title: 'Adaptive Learning Algorithms in K-12 STEM Education',
    author: 'Radhika Sen',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    content: 'Intelligent tutoring platforms monitor problem-solving hesitation times and concept mastery to dynamically tailor curriculum difficulties per student.',
    likes: 0
  },
  {
    title: 'Immersive VR Laboratories for Physics and Chemistry Simulation',
    author: 'Vivek Joshi',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
    content: 'Virtual reality headgear enables students in underfunded colleges to safely experiment with hazardous chemical reagents and high-energy physics apparati.',
    likes: 0
  },
  {
    title: 'Continuous Upskilling: Bridging the Industry-Academia Divide',
    author: 'Kavita Menon',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    content: 'Micro-credentials and corporate collaborative bootcamps are rapidly replacing traditional static diplomas by emphasizing live industry-standard portfolio capstones.',
    likes: 0
  },
  {
    title: 'The Psychology of Gamified Learning and Spaced Repetition',
    author: 'Tarun Saxena',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    content: 'Integrating Leitner box memory algorithms with streak rewards maximizes cognitive retention for complex languages and programmatic syntax.',
    likes: 0
  },

  // --- 7. Career & Jobs ---
  {
    title: 'Mastering Technical Interviews: System Design and DSA',
    author: 'Mohit Agarwal',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    content: 'Cracking FAANG technical rounds demands disciplined practice with graph traversals, distributed caching, CAP theorem trade-offs, and horizontal scalability breakdowns.',
    likes: 0
  },
  {
    title: 'Navigating Remote Work Culture Across Global Time Zones',
    author: 'Shalini Pillai',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
    content: 'Asynchronous documentation, clear Loom video updates, and transparent Jira backlog grooming prevent burnout while managing cross-continental engineering squads.',
    likes: 0
  },
  {
    title: 'Transitioning from Individual Contributor to Engineering Manager',
    author: 'Gaurav Bhatia',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    content: 'The step up to management shifts focus from personal commit velocity to mentoring, resolving team friction, roadmap stakeholder communication, and psychological safety.',
    likes: 0
  },
  {
    title: 'Optimizing LinkedIn and GitHub for Senior Developer Roles',
    author: 'Divya Rastogi',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    content: 'Writing actionable README guides, showcasing deployed live applications, and pinning high-impact architectural PRs consistently attract direct recruiter outreach.',
    likes: 0
  },

  // --- 8. Arts, Media & Communication ---
  {
    title: 'The Evolution of Narrative Storytelling in Cinema and Gaming',
    author: 'Kabir Roy',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=80',
    content: 'Non-linear branching interactive storytelling is fusing movie screenplay emotional resonance with player agency in modern AAA gaming titles.',
    likes: 0
  },
  {
    title: 'Sound Design and Foley Artistry in Modern Sci-Fi Cinema',
    author: 'Rhea Chakraborty',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    content: 'Layering analog modular synthesizer frequencies with organic field recordings creates visceral world-building soundscapes for otherworldly spacecraft and alien atmospheres.',
    likes: 0
  },
  {
    title: 'Visual Typography and Kinetic Layout Design for Digital Media',
    author: 'Farhan Zaidi',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    content: 'Fluid web typography, variable font axes, and micro-interactions elevate brand websites into expressive editorial experiences.',
    likes: 0
  },
  {
    title: 'Podcasting Equipment and Audio Mixing Workflows',
    author: 'Alia Merchant',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    content: 'Dynamic cardioid XLR microphones paired with multi-band compression, noise gating, and de-essers ensure pristine voice fidelity for long-form interviews.',
    likes: 0
  },

  // --- 9. Campus Life ---
  {
    title: 'Balancing College Academics with Open-Source Contributions',
    author: 'Yashwardhan Pandey',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    content: 'Practical tips on managing university semester exams while consistently committing code to major open-source web frameworks and developer tooling repositories.',
    likes: 0
  },
  {
    title: 'Winning Hackathons: Prototyping and Pitching in 36 Hours',
    author: 'Shruti Hegde',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    content: 'Rapid idea scoping, selecting battle-tested component libraries, and dedicating the final 4 hours exclusively to presentation slides and demo polish wins hackathons.',
    likes: 0
  },
  {
    title: 'Budgeting and Financial Independence for College Undergrads',
    author: 'Karan Singhal',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    content: 'Managing internship stipends, tracking hostel grocery expenses, and starting early index fund investments establishes long-term financial security during college years.',
    likes: 0
  },
  {
    title: 'Building Thriving Student Developer Clubs on Campus',
    author: 'Manish Tiwari',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    content: 'Organizing hands-on Git workshops, hosting internal alumni AMAs, and fostering collaborative project showcases drives active student club participation.',
    likes: 0
  },

  // --- 10. Additional Cross-Industry Special Articles ---
  {
    title: 'WebAssembly (WASM): Running High-Performance C++ in the Browser',
    author: 'Abhinav Soni',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    content: 'Compiling high-performance native engines into portable WebAssembly binaries enables near-native video editing, CAD rendering, and 3D games directly inside standard web tabs.',
    likes: 0
  },
  {
    title: 'Explainable AI (XAI) in Automated Loan Underwriting',
    author: 'Tanvi Mathur',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    content: 'SHAP and LIME interpretability frameworks explain complex neural network decisions, ensuring credit scoring algorithms comply with regulatory fairness standards.',
    likes: 0
  },
  {
    title: 'Green Hydrogen and the Future of Zero-Emission Construction Sites',
    author: 'Deepak Vohra',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=800&q=80',
    content: 'Hydrogen fuel-cell electric excavators and zero-emission generators are replacing diesel plants on urban building sites, drastically mitigating noise and smog.',
    likes: 0
  },
  {
    title: 'The Rise of Digital Nomads: Working from Co-Living Spaces Globally',
    author: 'Natasha Dsouza',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=80',
    content: 'How location-independent software engineers, designers, and consultants navigate international visas, global health insurance, and ergonomics while traveling the world.',
    likes: 0
  }
];

// Database Execution
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected for reset...');
    await Post.deleteMany({});
    await Post.insertMany(samplePosts);
    console.log(`Database successfully reset with ${samplePosts.length} posts and 0 initial likes!`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });