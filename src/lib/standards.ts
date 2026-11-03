// المعايير العشرة للاختبار التربوي العام (الرخصة المهنية للمعلمين في السعودية) موزعة على ثلاثة مجالات، بصياغتنا،
// مع ربط كل معيار بمحاور الموقع ومقالاته. النص الرسمي في دليل المعايير المهنية الصادر عن هيئة تقويم التعليم والتدريب
export type Standard = {
  n: number;
  slug: string;
  title: string;
  about: string;
  asks: string[];
  courses: string[];
  articles: string[];
};

export type Domain = { id: string; title: string; color: string; about: string; standards: Standard[] };

export const DOMAINS: Domain[] = [
  {
    id: "values",
    title: "القيم والمسؤوليات المهنية",
    color: "#8A6A12",
    about: "ما يلتزم به المعلم بوصفه صاحب مهنة: أخلاقياتها، ونموه المهني، وعلاقته بزملائه ومجتمعه.",
    standards: [
      {
        n: 1,
        slug: "ethics-identity",
        title: "الالتزام بالقيم وأخلاقيات المهنة وتعزيز الهوية الوطنية",
        about: "يقيس التزام المعلم بالقيم الإسلامية الوسطية، وبأخلاقيات مهنة التعليم، ودوره في تعزيز الانتماء والهوية الوطنية عند طلابه.",
        asks: ["التصرف المهني في مواقف فيها تعارض مصالح أو ضغط", "العدل بين الطلاب واحترام خصوصيتهم وكرامتهم", "غرس القيم والمواطنة في الدرس العادي"],
        courses: ["F1"],
        articles: ["teaching-ethics", "dealing-with-cheating", "digital-citizenship", "kohlberg-moral"],
      },
      {
        n: 2,
        slug: "professional-development",
        title: "التطوير المهني المستمر",
        about: "يقيس وعي المعلم بأن مهنته تحتاج تعلمًا لا يتوقف: التأمل في ممارسته، والبحث الإجرائي، والاستفادة من الملاحظة والتغذية الراجعة.",
        asks: ["كيف يحسّن المعلم أداءه بعد حصة لم تنجح", "مصادر النمو المهني ومجتمعات التعلم", "الاستفادة من زيارة المشرف أو الزميل"],
        courses: ["F1"],
        articles: ["reflective-teaching", "action-research", "professional-learning-communities", "mentor-teacher", "educational-supervision"],
      },
      {
        n: 3,
        slug: "professional-interaction",
        title: "التفاعل المهني مع التربويين والمجتمع",
        about: "يقيس قدرة المعلم على العمل مع زملائه وإدارته، والتواصل مع الأسر، والشراكة مع المجتمع لخدمة تعلم الطلاب.",
        asks: ["التواصل مع ولي أمر غاضب أو غير متعاون", "العمل ضمن فريق في المدرسة", "إشراك الأسرة في دعم تعلم ابنها"],
        courses: ["F1"],
        articles: ["parents-communication", "professional-learning-communities", "student-absenteeism"],
      },
    ],
  },
  {
    id: "knowledge",
    title: "المعرفة المهنية",
    color: "#1F6FA8",
    about: "ما يجب أن يعرفه المعلم: مهارات أساسية، والطالب وكيف يتعلم، ومحتوى تخصصه، وطرق التدريس.",
    standards: [
      {
        n: 4,
        slug: "language-quantitative",
        title: "الإلمام بالمهارات اللغوية والكمية",
        about: "يقيس سلامة لغة المعلم وفهمه للنصوص، وقدرته على التعامل مع الأرقام والبيانات البسيطة التي يحتاجها في عمله، مثل قراءة النتائج وتفسيرها.",
        asks: ["فهم نص تربوي واستنتاج فكرته", "قراءة جدول أو رسم بياني لنتائج طلاب", "حسابات بسيطة: نسب ومتوسطات"],
        courses: ["M4"],
        articles: ["interpreting-scores", "test-item-analysis", "reading-comprehension-strategies"],
      },
      {
        n: 5,
        slug: "learner-learning",
        title: "المعرفة بالمتعلم وكيفية تعلمه",
        about: "أكبر معايير الاختبار حضورًا في الأسئلة: مراحل النمو، والفروق الفردية، والدافعية، ونظريات التعلم وتطبيقاتها في الصف.",
        asks: ["ربط سلوك طالب بمرحلته النمائية", "تمييز النظرية التي يقوم عليها موقف صفي", "مراعاة الفروق الفردية وذوي الاحتياجات"],
        courses: ["M1", "M2", "M3", "SE1"],
        articles: ["piaget-stages", "erikson-stages", "zpd-scaffolding", "bandura-social-learning", "cognitive-load-theory", "student-motivation", "skinner-operant-conditioning"],
      },
      {
        n: 6,
        slug: "content-pedagogy",
        title: "المعرفة بمحتوى التخصص وطرق تدريسه",
        about: "في الاختبار العام يأتي هذا المعيار بصورة عامة: كيف يحوّل المعلم محتوى مادته إلى تعلم مفهوم. ويُقاس بعمق في الاختبار التخصصي.",
        asks: ["اختيار تمثيل مناسب لمفهوم صعب", "اكتشاف التصورات الخاطئة الشائعة في المادة", "ترتيب المحتوى من البسيط إلى المعقد"],
        courses: ["M5"],
        articles: ["bruner-discovery-learning", "ausubel-meaningful-learning", "diagnostic-assessment"],
      },
      {
        n: 7,
        slug: "teaching-methods",
        title: "المعرفة بطرق التدريس العامة",
        about: "يقيس معرفة المعلم باستراتيجيات التدريس، ومتى تناسب كل منها: التعلم النشط والتعاوني، والاستقصاء، وحل المشكلات، والتعليم المتمايز.",
        asks: ["اختيار الاستراتيجية الأنسب لهدف وصف معين", "خطوات استراتيجية مثل جيجسو أو الاستقصاء", "تكييف التدريس لصف مزدحم أو متفاوت"],
        courses: ["M5"],
        articles: ["cooperative-learning", "jigsaw-strategy", "inquiry-based-learning", "problem-based-learning", "differentiated-instruction", "active-learning-crowded-class"],
      },
    ],
  },
  {
    id: "practice",
    title: "الممارسة المهنية",
    color: "#136F5C",
    about: "ما يفعله المعلم في صفه فعلًا: يخطط وينفذ، ويهيئ بيئة تعلم، ويقوّم تعلم طلابه.",
    standards: [
      {
        n: 8,
        slug: "planning-teaching",
        title: "التخطيط للتدريس وتنفيذه",
        about: "يقيس قدرة المعلم على صياغة أهداف واضحة، وتصميم درس متسلسل، وتنفيذه بمهارات التدريس الأساسية من التهيئة إلى الغلق.",
        asks: ["صياغة هدف سلوكي قابل للقياس", "ترتيب خطوات الدرس", "مهارات التهيئة والأسئلة وغلق الدرس"],
        courses: ["M5", "C1"],
        articles: ["writing-objectives", "bloom-taxonomy-revised", "lesson-plan-steps", "lesson-opening-hooks", "lesson-closure", "gagne-nine-events", "wait-time-questioning"],
      },
      {
        n: 9,
        slug: "learning-environment",
        title: "تهيئة بيئات تعلم تفاعلية وداعمة",
        about: "يقيس قدرة المعلم على إدارة صفه، وبناء علاقة إيجابية مع طلابه، والتعامل مع السلوك، وجعل الصف آمنًا ودامجًا للجميع.",
        asks: ["التدخل الأنسب مع سلوك غير مرغوب", "بناء القواعد والإجراءات الصفية", "دمج الطلاب ذوي الاحتياجات"],
        courses: ["M5", "SE1"],
        articles: ["positive-discipline", "classroom-routines", "teacher-student-relationship", "first-year-classroom", "inclusive-classroom", "bullying-teacher-plan"],
      },
      {
        n: 10,
        slug: "assessment",
        title: "التقويم",
        about: "يقيس معرفة المعلم بأنواع التقويم وأدواته، وبناء الاختبارات، وتفسير النتائج، واستخدامها في تحسين التعلم.",
        asks: ["التمييز بين التقويم التشخيصي والبنائي والختامي", "الصدق والثبات وجدول المواصفات", "اختيار أداة تقويم مناسبة لمهارة"],
        courses: ["M4"],
        articles: ["formative-assessment-tools", "validity-reliability", "test-blueprint", "rubric-design", "writing-mcq", "norm-criterion-referenced", "authentic-assessment"],
      },
    ],
  },
];

export const ALL_STANDARDS = DOMAINS.flatMap((d) => d.standards.map((s) => ({ ...s, domain: d })));
