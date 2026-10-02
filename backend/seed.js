const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');

const samplePosts = [
  {
    title: 'Zero-Trust Architecture: Modern Cloud Security Standards',
    author: 'Siddharth Rao',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    content: 'Zero Trust eliminates implicit trust anywhere on the network. Every connection request, whether originating internally or externally, is authenticated, authorized, and continuously validated before granting access to infrastructure.'
  },
  {
    title: 'Precision Oncology: Tailoring Treatments via Genomic Sequencing',
    author: 'Dr. Kevin Vance',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    content: 'Genomic tumor profiling helps oncologists prescribe targeted biological therapies rather than generalized regimens, improving survival rates and clinical outcomes.'
  },
  {
    title: 'Building Information Modeling (BIM) in Mega-Infrastructure',
    author: 'Anand Kadam',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    content: 'Comprehensive 3D BIM models prevent expensive on-site structural clashes by coordinating mechanical, electrical, and structural engineering designs before laying foundations.'
  },
  {
    title: 'Autonomous Agents and Recursive Reasoning Loops',
    author: 'Dr. Aisha Mehra',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
    content: 'AI systems are advancing beyond static text generation into multi-agent collaboration, autonomous web navigation, persistent memory recall, and deterministic tool-calling workflows.'
  },
  {
    title: 'Corporate Treasury Strategies in Dynamic Interest Rate Cycles',
    author: 'Rachit Singhania',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    content: 'Financial executives must balance high-yield short-term paper with liquid capital requirements, leveraging automated sweeping accounts and cash-flow scenario modeling.'
  },
  {
    title: 'Gamification and Adaptive Learning Paths in STEM Education',
    author: 'Prof. Ramesh Sen',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    content: 'Adaptive curricula adjust algorithmic question difficulty based on student comprehension and pacing, boosting test scores and retention across engineering classrooms.'
  },
  {
    title: 'Building a Standout Software Engineering Portfolio',
    author: 'Neha Verma',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    content: 'Recruiters look for working deployments, readable architecture, and clean documentation. Demonstrating end-to-end full stack ownership sets candidates apart in competitive job markets.'
  },
  {
    title: 'Digital Preservation of Cultural Heritage via 3D Photogrammetry',
    author: 'Sunita Roy',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    content: 'Museums are turning to high-resolution 3D scanning to preserve delicate ancient sculptures and architecture, making them accessible to global researchers online.'
  },
  {
    title: 'Balancing Engineering Coursework with Side Projects',
    author: 'Rohan Deshmukh',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    content: 'Balancing lab records, theory exams, and coding projects requires intentional scheduling. Dedicating uninterrupted 90-minute blocks each morning keeps projects moving forward.'
  },
  {
    title: 'Wearable Biosensors and Preventive Medicine',
    author: 'Dr. Sameer Joshi',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
    content: 'Continuous biometric tracking delivers proactive medical monitoring. Early detection algorithms can alert clinicians to irregular ECG rhythms, oxygen drops, and metabolic spikes.'
  },
  {
    title: 'The Evolution of Container Orchestration with Kubernetes',
    author: 'Vikram Joshi',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    content: 'Automated horizontal scaling, self-healing pod management, and declarative YAML rollouts make container orchestration an essential foundation for large-scale production applications.'
  },
  {
    title: 'Multimodal Vision Models in Industrial Automation',
    author: 'Marcus Chen',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    content: 'Computer vision algorithms now evaluate high-speed manufacturing lines, catching sub-millimeter defects on circuit boards and robotic welding lines in real time.'
  },
  {
    title: 'Low-Carbon Geopolymer Concrete in High-Rise Architecture',
    author: 'Marcus Bennett',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=800&q=80',
    content: 'Substituting Portland cement with industrial fly-ash geopolymer binders slashes embodied carbon footprints significantly while retaining high early-age compressive strength.'
  },
  {
    title: 'Tokenization of Real-World Assets on Institutional Blockchains',
    author: 'Vikram Merchant',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    content: 'Asset tokenization introduces fractional ownership, instantaneous trade settlement, and cross-border accessibility to private equity, real estate, and municipal debt issuances.'
  },
  {
    title: 'Immersive VR Simulations for Industrial and Technical Training',
    author: 'Clara Oswald',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    content: 'Virtual reality training spaces allow high-voltage electricians and aviation pilots to practice safety and emergency drills safely without taking physical machinery offline.'
  },
  {
    title: 'Navigating Cross-Functional Communication as an Engineer',
    author: 'Tariq Mansoor',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    content: 'Clear written design docs, transparent status updates, and empathy for product requirements build credibility and open leadership pathways faster than raw coding speed.'
  },
  {
    title: 'The Power of Dynamic Lighting and Color Grading in Cinema',
    author: 'Julian Thorne',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    content: 'Color theory in cinematography subtly directs viewers attention and emotions. Balanced contrast ratios and intentional chromatic shifts establish tone and subtext.'
  },
  {
    title: 'Organizing Hackathons: Team Building and Midnight Troubleshooting',
    author: 'Kavita Kulkarni',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    content: 'Hosting student hackathons teaches rapid problem solving, managing emergency WiFi dropouts, and coordinating logistics, creating memorable collegiate experiences.'
  },
  {
    title: 'AI Diagnostics in Radiology: Clinical Augmentation',
    author: 'Dr. Meera Patel',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    content: 'Deep learning diagnostic models assist radiologists by highlighting pulmonary nodules and occult bone fractures, reducing diagnostic turnaround times in critical emergency departments.'
  },
  {
    title: 'Migrating Legacy Enterprise Systems to Distributed Microservices',
    author: 'Elena Gomez',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    content: 'Transitioning from monolithic codebases requires careful domain-driven design, event-driven streaming queues, and robust API gateway routing to maintain high uptime during migration.'
  },
  {
    title: 'Vector Databases and the Scalability of Retrieval Systems',
    author: 'Karan Mehra',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80',
    content: 'Approximate nearest neighbor indexing methods like HNSW allow retrieval engines to index millions of high-dimensional embeddings while serving semantic queries with low latency.'
  },
  {
    title: 'Modular Prefabrication: Accelerating Urban Housing Delivery',
    author: 'Naveen Rao',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    content: 'Precision off-site prefabrication allows electrical, plumbing, and interior finishing to occur simultaneously in factory settings, cutting site construction timelines in half.'
  },
  {
    title: 'Venture Capital Trends: Funding Sustainable Climate Tech',
    author: 'Sophie Martin',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    content: 'Private equity and VC firms are directing large investment syndicates toward long-duration energy storage, carbon capture infrastructure, and electrified supply-chain logistics.'
  },
  {
    title: 'The Shift Toward Modular Industry Certifications',
    author: 'David Tan',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80',
    content: 'Focused modular technical certifications backed by practical project portfolios are becoming widely recognized as hiring criteria alongside traditional university diplomas.'
  },
  {
    title: 'Mastering Remote Team Collaboration and Asynchronous Work',
    author: 'Nathaniel Drake',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=800&q=80',
    content: 'Effective remote work relies on clear pull request descriptions, recording quick walkthrough demos, and respecting asynchronous time-zone gaps.'
  },
  {
    title: 'Reviving Investigative Journalism Through Long-Form Audio',
    author: 'Gaurav Kulkarni',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    content: 'Listener-supported podcasts and investigative audio series demonstrate that deep, patient storytelling remains impactful in an era saturated with short video clips.'
  },
  {
    title: 'Navigating Final-Year Capstone Project Demonstrations',
    author: 'Tanvi Shinde',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    content: 'Delivering capstone presentations successfully depends on demonstrating working error-handling and live features, rather than relying on endless slide decks.'
  },
  {
    title: 'Edge Computing and Serverless Runtimes in 2026',
    author: 'Divya Nair',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    content: 'Moving backend logic to globally distributed edge nodes reduces network latency down to single-digit milliseconds for international end users.'
  },
  {
    title: 'Robotics in Surgical Operations: Enhancing Precision',
    author: 'Dr. Rahul Bose',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    content: 'Minimally invasive robotic surgical arms eliminate natural hand tremors, enabling surgeons to complete micro-sutures inside sensitive neurovascular cavities safely.'
  },
  {
    title: 'Structural Health Monitoring of Long-Span Bridges Using IoT',
    author: 'Pooja Iyer',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    content: 'Piezoelectric vibration sensors and strain gauges attached to suspension cables detect microscopic metal fatigue, helping civil engineers schedule targeted maintenance.'
  },
  {
    title: 'Reinforcement Learning from Human Feedback (RLHF) Dynamics',
    author: 'Tanya Dixit',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    content: 'Alignment techniques ensure high-capacity foundation models adhere to human safety guidelines, output constraints, and helpful conversational parameters.'
  },
  {
    title: 'Risk Management in Decentralized Lending Protocols',
    author: 'Aditya Kothari',
    category: 'Business & Finance',
    imageUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    content: 'Automated liquidation triggers and collateralization ratios maintain solvency across peer-to-peer liquidity pools during sudden crypto asset market downturns.'
  },
  {
    title: 'Language Acquisition Through Immersion and Interactive Audio',
    author: 'Maria Fernandez',
    category: 'Education & Training',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    content: 'Natural conversational chatbots and dynamic audio prompts train active vocabulary and natural pronunciation better than rote grammar textbook drills.'
  },
  {
    title: 'Technical Interviewing: System Design Principles for Beginners',
    author: 'Jason Cole',
    category: 'Career & Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    content: 'Architecting scalable applications under interviewer scrutiny requires estimating traffic capacity, evaluating database choices, and outlining caching layers.'
  },
  {
    title: 'Typography and Emotional Nuance in Digital Editorial Design',
    author: 'Lucas Vance',
    category: 'Arts, Media & Communication',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    content: 'Pairing modern sans-serif headings with classic serif body types shapes readability, authoritative voice, and user engagement across online publications.'
  },
  {
    title: 'Finding the Best Late-Night Study Spaces on College Campus',
    author: 'Pranav Sawant',
    category: 'Campus Life',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    content: 'When central libraries fill up during midterms, knowing which academic building lounges have steady electrical outlets and silent corners keeps study sessions productive.'
  },
  {
    title: 'Database Indexing Techniques for Real-Time Analytics',
    author: 'Harsh Vardhan',
    category: 'Information Technology',
    imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80',
    content: 'Compound indexes, partial indexing, and time-to-live collections reduce query response latencies from multiple seconds down to a few milliseconds.'
  },
  {
    title: 'EHR Interoperability: Connecting Hospital Data Networks',
    author: 'Dr. Aris Thorne',
    category: 'Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    content: 'Standardized FHIR APIs enable disparate electronic health record software to securely share critical allergy records, immunization histories, and prescription data.'
  },
  {
    title: 'Smart Seismic Dampers in Modern Earthquake Engineering',
    author: 'Rachel Green',
    category: 'Engineering & Construction',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    content: 'Tuned mass dampers and hydraulic shock absorbers embedded in high-rise towers counteract severe ground tremors during high-magnitude seismic events.'
  },
  {
    title: 'Fine-Tuning Open Source LLMs for Specialized Domains',
    author: 'Siddharth Nair',
    category: 'Artificial Intelligence',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    content: 'LoRA and parameter-efficient fine-tuning allow engineers to tailor generalized models for legal, financial, and code reasoning tasks with minimal hardware overhead.'
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    console.log('Clearing old database entries...');
    await Post.deleteMany({});

    console.log(`Seeding ${samplePosts.length} posts across all target categories...`);
    await Post.insertMany(samplePosts);

    console.log('Database successfully reset and seeded with 40 posts!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();