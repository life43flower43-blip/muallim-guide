// مراجع المقالات: كتب ودراسات معروفة تستند إليها أفكار كل مقال. تُعرض في نهاية المقال تحت «المراجع»
// نذكر المرجع بلغته الأصلية كما هو متعارف عليه في الكتابة الأكاديمية
const ETEC = "هيئة تقويم التعليم والتدريب: الرخص المهنية للمعلمين، etec.gov.sa";
const HATTIE = "Hattie, J. (2009). Visible Learning: A Synthesis of over 800 Meta-Analyses Relating to Achievement. Routledge.";
const MARZANO = "Marzano, R. J. (2003). Classroom Management That Works. ASCD.";
const ROSENSHINE = "Rosenshine, B. (2012). Principles of Instruction. American Educator, 36(1), 12–19.";
const BLACK_WILIAM = "Black, P., & Wiliam, D. (1998). Inside the Black Box: Raising Standards Through Classroom Assessment. Phi Delta Kappan, 80(2).";
const DSM5 = "American Psychiatric Association. (2013). Diagnostic and Statistical Manual of Mental Disorders (DSM-5).";
const DUNLOSKY = "Dunlosky, J., et al. (2013). Improving Students' Learning With Effective Learning Techniques. Psychological Science in the Public Interest, 14(1).";
const JOHNSON = "Johnson, D. W., & Johnson, R. T. (1999). Learning Together and Alone. Allyn & Bacon.";
const TOMLINSON = "Tomlinson, C. A. (2001). How to Differentiate Instruction in Mixed-Ability Classrooms. ASCD.";
const ANDERSON = "Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). A Taxonomy for Learning, Teaching, and Assessing. Longman.";
const SWELLER = "Sweller, J. (1988). Cognitive Load During Problem Solving. Cognitive Science, 12(2), 257–285.";
const VYGOTSKY = "Vygotsky, L. S. (1978). Mind in Society. Harvard University Press.";
const PIAGET = "Piaget, J., & Inhelder, B. (1969). The Psychology of the Child. Basic Books.";
const EPSTEIN = "Epstein, J. L. (2001). School, Family, and Community Partnerships. Westview Press.";
const SCHON = "Schön, D. A. (1983). The Reflective Practitioner. Basic Books.";
const DUFOUR = "DuFour, R., & Eaker, R. (1998). Professional Learning Communities at Work. Solution Tree.";
const GRONLUND = "Gronlund, N. E. (2006). Assessment of Student Achievement. Pearson.";
const POPHAM = "Popham, W. J. (2017). Classroom Assessment: What Teachers Need to Know. Pearson.";
const BROOKHART = "Brookhart, S. M. (2013). How to Create and Use Rubrics for Formative Assessment and Grading. ASCD.";
const DECI = "Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A Meta-Analytic Review of Experiments Examining the Effects of Extrinsic Rewards on Intrinsic Motivation. Psychological Bulletin, 125(6).";
const CORNELIUS = "Cornelius-White, J. (2007). Learner-Centered Teacher-Student Relationships Are Effective: A Meta-Analysis. Review of Educational Research, 77(1).";
const DURLAK = "Durlak, J. A., et al. (2011). The Impact of Enhancing Students' Social and Emotional Learning. Child Development, 82(1).";
const KIRSCHNER = "Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why Minimal Guidance During Instruction Does Not Work. Educational Psychologist, 41(2).";
const BANDURA = "Bandura, A. (1977). Social Learning Theory. Prentice Hall.";
const SKINNER = "Skinner, B. F. (1953). Science and Human Behavior. Macmillan.";
const NELSEN = "Nelsen, J. (2006). Positive Discipline (rev. ed.). Ballantine Books.";
const WONG = "Wong, H. K., & Wong, R. T. (2009). The First Days of School. Harry K. Wong Publications.";
const KOUNIN = "Kounin, J. S. (1970). Discipline and Group Management in Classrooms. Holt, Rinehart & Winston.";
const ROWE = "Rowe, M. B. (1986). Wait Time: Slowing Down May Be a Way of Speeding Up! Journal of Teacher Education, 37(1).";
const MAYER = "Mayer, R. E. (2009). Multimedia Learning (2nd ed.). Cambridge University Press.";
const BOSS = "Larmer, J., Mergendoller, J., & Boss, S. (2015). Setting the Standard for Project Based Learning. ASCD.";
const PALINCSAR = "Palincsar, A. S., & Brown, A. L. (1984). Reciprocal Teaching of Comprehension-Fostering and Comprehension-Monitoring Activities. Cognition and Instruction, 1(2).";
const IDA = "International Dyslexia Association. Definition of Dyslexia. dyslexiaida.org";
const UNESCO_AI = "UNESCO. (2023). Guidance for Generative AI in Education and Research.";

export const ARTICLE_REFS: Record<string, string[]> = {
  "21st-century-skills": ["Trilling, B., & Fadel, C. (2009). 21st Century Skills: Learning for Life in Our Times. Jossey-Bass.", "OECD. (2018). The Future of Education and Skills: Education 2030."],
  "action-research": ["Mertler, C. A. (2019). Action Research: Improving Schools and Empowering Educators. SAGE.", "Kemmis, S., & McTaggart, R. (1988). The Action Research Planner. Deakin University Press."],
  "active-learning-crowded-class": ["Bonwell, C. C., & Eison, J. A. (1991). Active Learning: Creating Excitement in the Classroom. ASHE-ERIC Report.", "Freeman, S., et al. (2014). Active Learning Increases Student Performance in Science, Engineering, and Mathematics. PNAS, 111(23)."],
  "adhd-classroom": [DSM5, "Barkley, R. A. (2013). Taking Charge of ADHD (3rd ed.). Guilford Press."],
  "adolescent-students": ["Steinberg, L. (2014). Age of Opportunity: Lessons from the New Science of Adolescence. Houghton Mifflin Harcourt.", "Erikson, E. H. (1968). Identity: Youth and Crisis. Norton."],
  "aggressive-behavior": [BANDURA, "Greene, R. W. (2014). Lost at School. Scribner.", MARZANO],
  "ai-homework-design": [UNESCO_AI],
  "ai-lesson-prep": [UNESCO_AI, "U.S. Department of Education. (2023). Artificial Intelligence and the Future of Teaching and Learning."],
  "ausubel-meaningful-learning": ["Ausubel, D. P. (1968). Educational Psychology: A Cognitive View. Holt, Rinehart & Winston.", "Novak, J. D., & Gowin, D. B. (1984). Learning How to Learn. Cambridge University Press."],
  "authentic-assessment": ["Wiggins, G. (1990). The Case for Authentic Assessment. Practical Assessment, Research & Evaluation, 2(2).", POPHAM],
  "autism-classroom": [DSM5, "National Autistic Society. Autism: A Guide for Education Professionals. autism.org.uk"],
  "bandura-social-learning": [BANDURA, "Bandura, A., Ross, D., & Ross, S. A. (1961). Transmission of Aggression Through Imitation of Aggressive Models. Journal of Abnormal and Social Psychology, 63(3)."],
  "blended-learning": ["Horn, M. B., & Staker, H. (2014). Blended: Using Disruptive Innovation to Improve Schools. Jossey-Bass."],
  "bloom-taxonomy-revised": ["Bloom, B. S. (Ed.). (1956). Taxonomy of Educational Objectives: Handbook I, Cognitive Domain. David McKay.", ANDERSON],
  "brainstorming-classroom": ["Osborn, A. F. (1953). Applied Imagination. Scribner.", "Diehl, M., & Stroebe, W. (1987). Productivity Loss in Brainstorming Groups. Journal of Personality and Social Psychology, 53(3)."],
  "bruner-discovery-learning": ["Bruner, J. S. (1960). The Process of Education. Harvard University Press.", "Bruner, J. S. (1966). Toward a Theory of Instruction. Harvard University Press.", KIRSCHNER],
  "bullying-teacher-plan": ["Olweus, D. (1993). Bullying at School: What We Know and What We Can Do. Blackwell."],
  "class-time-management": [KOUNIN, MARZANO],
  "classroom-routines": [WONG, MARZANO],
  "classroom-seating": ["Adams, R. S., & Biddle, B. J. (1970). Realities of Teaching: Explorations with Video Tape. Holt, Rinehart & Winston.", "Wannarka, R., & Ruhl, K. (2008). Seating Arrangements That Promote Positive Academic and Behavioural Outcomes. Support for Learning, 23(2)."],
  "cognitive-load-theory": [SWELLER, "Sweller, J., van Merriënboer, J. J. G., & Paas, F. (1998). Cognitive Architecture and Instructional Design. Educational Psychology Review, 10(3).", MAYER],
  "constructivism-classroom": [PIAGET, VYGOTSKY, "Bybee, R. W., et al. (2006). The BSCS 5E Instructional Model. BSCS.", KIRSCHNER],
  "cooperative-learning": [JOHNSON, "Slavin, R. E. (1995). Cooperative Learning: Theory, Research, and Practice. Allyn & Bacon."],
  "critical-thinking": ["Ennis, R. H. (1987). A Taxonomy of Critical Thinking Dispositions and Abilities. In Teaching Thinking Skills. Freeman.", "Willingham, D. T. (2007). Critical Thinking: Why Is It So Hard to Teach? American Educator, 31(2)."],
  "dealing-with-cheating": ["Anderman, E. M., & Murdock, T. B. (Eds.). (2007). Psychology of Academic Cheating. Academic Press.", "McCabe, D. L., Butterfield, K. D., & Treviño, L. K. (2012). Cheating in College. Johns Hopkins University Press."],
  "demo-lesson": [ROSENSHINE],
  "diagnostic-assessment": [GRONLUND, POPHAM],
  "differentiated-instruction": [TOMLINSON],
  "digital-citizenship": ["Ribble, M. (2015). Digital Citizenship in Schools (3rd ed.). ISTE."],
  "discussion-method": ["Brookfield, S. D., & Preskill, S. (2005). Discussion as a Way of Teaching (2nd ed.). Jossey-Bass."],
  "dyscalculia": ["Butterworth, B. (2003). Dyscalculia Screener. nferNelson.", DSM5],
  "dyslexia-classroom": [IDA, "Shaywitz, S. (2003). Overcoming Dyslexia. Knopf."],
  "education-myths": ["Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning Styles: Concepts and Evidence. Psychological Science in the Public Interest, 9(3).", DUNLOSKY],
  "educational-supervision": ["Glickman, C. D., Gordon, S. P., & Ross-Gordon, J. M. (2018). SuperVision and Instructional Leadership (10th ed.). Pearson.", "Goldhammer, R. (1969). Clinical Supervision. Holt, Rinehart & Winston."],
  "effective-feedback": ["Hattie, J., & Timperley, H. (2007). The Power of Feedback. Review of Educational Research, 77(1).", BLACK_WILIAM],
  "emotional-intelligence-students": ["Salovey, P., & Mayer, J. D. (1990). Emotional Intelligence. Imagination, Cognition and Personality, 9(3).", "Goleman, D. (1995). Emotional Intelligence. Bantam Books.", DURLAK],
  "erikson-stages": ["Erikson, E. H. (1950). Childhood and Society. Norton.", "Erikson, E. H. (1968). Identity: Youth and Crisis. Norton."],
  "essay-questions": [GRONLUND, "Reiner, C. M., et al. (2002). Preparing Effective Essay Questions. New Forums Press."],
  "first-year-classroom": [WONG, MARZANO],
  "flipped-classroom": ["Bergmann, J., & Sams, A. (2012). Flip Your Classroom. ISTE.", "Guo, P. J., Kim, J., & Rubin, R. (2014). How Video Production Affects Student Engagement. Proceedings of the ACM Conference on Learning at Scale."],
  "formative-assessment-tools": [BLACK_WILIAM, "Wiliam, D. (2011). Embedded Formative Assessment. Solution Tree."],
  "free-edtech-tools": ["Puentedura, R. R. (2006). Transformation, Technology, and Education (the SAMR model). hippasus.com"],
  "gagne-nine-events": ["Gagné, R. M. (1965). The Conditions of Learning. Holt, Rinehart & Winston.", "Gagné, R. M., Briggs, L. J., & Wager, W. W. (1992). Principles of Instructional Design (4th ed.). Harcourt Brace."],
  "gamification-classroom": ["Deterding, S., et al. (2011). From Game Design Elements to Gamefulness: Defining Gamification. Proceedings of MindTrek.", DECI],
  "gestalt-insight-learning": ["Köhler, W. (1925). The Mentality of Apes. Harcourt Brace.", "Wertheimer, M. (1945). Productive Thinking. Harper."],
  "gifted-students": ["Renzulli, J. S. (1978). What Makes Giftedness? Re-examining a Definition. Phi Delta Kappan, 60(3).", TOMLINSON],
  "graphic-organizers": ["Novak, J. D., & Gowin, D. B. (1984). Learning How to Learn. Cambridge University Press.", "Hyerle, D. (2009). Visual Tools for Transforming Information into Knowledge. Corwin."],
  "growth-mindset": ["Dweck, C. S. (2006). Mindset: The New Psychology of Success. Random House.", "Sisk, V. F., et al. (2018). To What Extent and Under Which Circumstances Are Growth Mind-Sets Important to Academic Achievement? Psychological Science, 29(4).", "Yeager, D. S., et al. (2019). A National Experiment Reveals Where a Growth Mindset Improves Achievement. Nature, 573."],
  "higher-order-questions": [ANDERSON, ROWE],
  "homework-research": ["Cooper, H., Robinson, J. C., & Patall, E. A. (2006). Does Homework Improve Academic Achievement? Review of Educational Research, 76(1)."],
  "iep-individual-plan": ["Bateman, B. D., & Linden, M. A. (2012). Better IEPs (5th ed.). Attainment Company."],
  "inattentive-active-student": [DSM5, KOUNIN],
  "inclusive-classroom": ["UNESCO. (2009). Policy Guidelines on Inclusion in Education.", "CAST. (2018). Universal Design for Learning Guidelines. udlguidelines.cast.org"],
  "information-processing": ["Atkinson, R. C., & Shiffrin, R. M. (1968). Human Memory: A Proposed System and Its Control Processes. In The Psychology of Learning and Motivation, Vol. 2. Academic Press.", "Miller, G. A. (1956). The Magical Number Seven, Plus or Minus Two. Psychological Review, 63(2)."],
  "inquiry-based-learning": ["Banchi, H., & Bell, R. (2008). The Many Levels of Inquiry. Science and Children, 46(2).", "National Research Council. (2000). Inquiry and the National Science Education Standards. National Academies Press."],
  "interpreting-scores": [GRONLUND, POPHAM],
  "jigsaw-strategy": ["Aronson, E., et al. (1978). The Jigsaw Classroom. SAGE.", JOHNSON],
  "kohlberg-moral": ["Kohlberg, L. (1981). The Philosophy of Moral Development. Harper & Row.", "Gilligan, C. (1982). In a Different Voice. Harvard University Press."],
  "language-skills-teacher-exam": [ETEC],
  "learning-stations": [TOMLINSON, "Horn, M. B., & Staker, H. (2014). Blended: Using Disruptive Innovation to Improve Schools. Jossey-Bass."],
  "lesson-closure": [ROSENSHINE, "Wiliam, D. (2011). Embedded Formative Assessment. Solution Tree."],
  "lesson-opening-hooks": ["Gagné, R. M. (1965). The Conditions of Learning. Holt, Rinehart & Winston.", ROSENSHINE],
  "lesson-plan-steps": ["Hunter, M. (1982). Mastery Teaching. TIP Publications.", "Wiggins, G., & McTighe, J. (2005). Understanding by Design (2nd ed.). ASCD."],
  "license-exam-common-mistakes": [ETEC, DUNLOSKY],
  "license-exam-day": [ETEC],
  "license-exam-plan": [ETEC, DUNLOSKY],
  "license-exam-situational-questions": [ETEC],
  "maslow-hierarchy-classroom": ["Maslow, A. H. (1943). A Theory of Human Motivation. Psychological Review, 50(4).", "Maslow, A. H. (1954). Motivation and Personality. Harper."],
  "mastery-learning": ["Bloom, B. S. (1968). Learning for Mastery. Evaluation Comment, 1(2).", "Carroll, J. B. (1963). A Model of School Learning. Teachers College Record, 64.", "Guskey, T. R. (2007). Closing Achievement Gaps: Revisiting Benjamin S. Bloom's Learning for Mastery. Journal of Advanced Academics, 19(1)."],
  "mentor-teacher": ["Ingersoll, R. M., & Strong, M. (2011). The Impact of Induction and Mentoring Programs for Beginning Teachers. Review of Educational Research, 81(2)."],
  "metacognition-students": ["Flavell, J. H. (1979). Metacognition and Cognitive Monitoring. American Psychologist, 34(10).", "Education Endowment Foundation. (2018). Metacognition and Self-Regulated Learning: Guidance Report."],
  "modern-teaching-strategies": [HATTIE, ROSENSHINE],
  "multiple-intelligences-gardner": ["Gardner, H. (1983). Frames of Mind: The Theory of Multiple Intelligences. Basic Books.", "Gardner, H. (2013). 'Multiple Intelligences' Are Not 'Learning Styles'. The Washington Post."],
  "national-identity-classroom": ["رؤية المملكة العربية السعودية 2030: برنامج تنمية القدرات البشرية، vision2030.gov.sa"],
  "negative-reinforcement": [SKINNER],
  "nonverbal-communication-teacher": ["Mehrabian, A. (1971). Silent Messages. Wadsworth.", KOUNIN],
  "norm-criterion-referenced": [GRONLUND, POPHAM],
  "observation-assessment": [GRONLUND, "Brookhart, S. M., & Nitko, A. J. (2019). Educational Assessment of Students (8th ed.). Pearson."],
  "online-teaching": ["Guo, P. J., Kim, J., & Rubin, R. (2014). How Video Production Affects Student Engagement. Proceedings of the ACM Conference on Learning at Scale.", MAYER],
  "parents-communication": [EPSTEIN],
  "pavlov-classical-conditioning": ["Pavlov, I. P. (1927). Conditioned Reflexes. Oxford University Press.", "Watson, J. B., & Rayner, R. (1920). Conditioned Emotional Reactions. Journal of Experimental Psychology, 3(1)."],
  "phones-in-class": ["UNESCO. (2023). Global Education Monitoring Report: Technology in Education."],
  "piaget-stages": [PIAGET],
  "play-based-learning": [VYGOTSKY, PIAGET, "Hirsh-Pasek, K., et al. (2009). A Mandate for Playful Learning in Preschool. Oxford University Press."],
  "portfolio-assessment": ["Paulson, F. L., Paulson, P. R., & Meyer, C. A. (1991). What Makes a Portfolio a Portfolio? Educational Leadership, 48(5).", POPHAM],
  "positive-discipline": [NELSEN, MARZANO],
  "problem-based-learning": ["Barrows, H. S., & Tamblyn, R. M. (1980). Problem-Based Learning: An Approach to Medical Education. Springer.", "Hmelo-Silver, C. E. (2004). Problem-Based Learning: What and How Do Students Learn? Educational Psychology Review, 16(3)."],
  "professional-development-plan": ["Guskey, T. R. (2000). Evaluating Professional Development. Corwin.", ETEC],
  "professional-learning-communities": [DUFOUR],
  "project-based-learning": [BOSS],
  "quantitative-skills-teacher-exam": [ETEC],
  "reading-comprehension-strategies": [PALINCSAR, "Pearson, P. D., & Gallagher, M. C. (1983). The Instruction of Reading Comprehension. Contemporary Educational Psychology, 8(3)."],
  "reflective-teaching": [SCHON, "Gibbs, G. (1988). Learning by Doing: A Guide to Teaching and Learning Methods. Oxford Polytechnic."],
  "resilience-students": ["Werner, E. E., & Smith, R. S. (1982). Vulnerable but Invincible. McGraw-Hill.", "Masten, A. S. (2014). Ordinary Magic: Resilience in Development. Guilford Press."],
  "role-play-teaching": ["Joyce, B., Weil, M., & Calhoun, E. (2015). Models of Teaching (9th ed.). Pearson."],
  "rubric-design": [BROOKHART],
  "school-community-partnership": [EPSTEIN],
  "sensory-impairments": ["UNESCO. (2009). Policy Guidelines on Inclusion in Education.", "CAST. (2018). Universal Design for Learning Guidelines. udlguidelines.cast.org"],
  "short-video-lessons": ["Guo, P. J., Kim, J., & Rubin, R. (2014). How Video Production Affects Student Engagement. Proceedings of the ACM Conference on Learning at Scale.", MAYER],
  "shy-students": ["Coplan, R. J., & Rudasill, K. M. (2016). Quiet at School: An Educator's Guide to Shy Children. Teachers College Press."],
  "skinner-operant-conditioning": ["Skinner, B. F. (1938). The Behavior of Organisms. Appleton-Century.", SKINNER, "Ferster, C. B., & Skinner, B. F. (1957). Schedules of Reinforcement. Appleton-Century-Crofts."],
  "slow-learners": [TOMLINSON, ROSENSHINE],
  "stem-education": ["National Research Council. (2011). Successful K-12 STEM Education. National Academies Press.", "Bybee, R. W. (2013). The Case for STEM Education. NSTA Press."],
  "storytelling-teaching": ["Willingham, D. T. (2009). Why Don't Students Like School? Jossey-Bass.", "Egan, K. (1986). Teaching as Story Telling. University of Chicago Press."],
  "student-absenteeism": ["Kearney, C. A. (2008). School Absenteeism and School Refusal Behavior in Youth. Clinical Psychology Review, 28(3)."],
  "student-motivation": ["Ryan, R. M., & Deci, E. L. (2000). Self-Determination Theory and the Facilitation of Intrinsic Motivation. American Psychologist, 55(1).", DECI],
  "student-self-assessment": [BLACK_WILIAM, "Andrade, H. L. (2019). A Critical Review of Research on Student Self-Assessment. Frontiers in Education, 4."],
  "study-methods-research": [DUNLOSKY, "Roediger, H. L., & Karpicke, J. D. (2006). Test-Enhanced Learning. Psychological Science, 17(3)."],
  "teacher-burnout": ["Maslach, C., & Jackson, S. E. (1981). The Measurement of Experienced Burnout. Journal of Occupational Behaviour, 2(2).", "World Health Organization. (2019). Burn-out an 'Occupational Phenomenon': ICD-11."],
  "teacher-cv": [ETEC],
  "teacher-ethics-situations": ["Campbell, E. (2003). The Ethical Teacher. Open University Press.", ETEC],
  "teacher-interview": [ETEC],
  "teacher-student-relationship": [CORNELIUS, MARZANO],
  "teacher-time-management": ["Wiliam, D. (2011). Embedded Formative Assessment. Solution Tree."],
  "teaching-ethics": ["Campbell, E. (2003). The Ethical Teacher. Open University Press.", ETEC],
  "test-anxiety": ["Zeidner, M. (1998). Test Anxiety: The State of the Art. Plenum.", "Putwain, D. (2008). Deconstructing Test Anxiety. Emotional and Behavioural Difficulties, 13(2)."],
  "test-blueprint": [GRONLUND, POPHAM],
  "test-item-analysis": [GRONLUND, "Ebel, R. L., & Frisbie, D. A. (1991). Essentials of Educational Measurement (5th ed.). Prentice Hall."],
  "thorndike-laws": ["Thorndike, E. L. (1911). Animal Intelligence. Macmillan.", "Thorndike, E. L. (1932). The Fundamentals of Learning. Teachers College."],
  "validity-reliability": ["American Educational Research Association, APA, & NCME. (2014). Standards for Educational and Psychological Testing.", GRONLUND],
  "wait-time-questioning": [ROWE, "Rowe, M. B. (1974). Wait-Time and Rewards as Instructional Variables. Journal of Research in Science Teaching, 11(2)."],
  "writing-mcq": ["Haladyna, T. M., Downing, S. M., & Rodriguez, M. C. (2002). A Review of Multiple-Choice Item-Writing Guidelines. Applied Measurement in Education, 15(3).", GRONLUND],
  "writing-objectives": ["Mager, R. F. (1962). Preparing Instructional Objectives. Fearon.", ANDERSON],
  "zpd-scaffolding": [VYGOTSKY, "Wood, D., Bruner, J. S., & Ross, G. (1976). The Role of Tutoring in Problem Solving. Journal of Child Psychology and Psychiatry, 17(2)."],
};
