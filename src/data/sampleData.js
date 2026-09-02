// Generic academic sample data — no institution-specific branding
export const SAMPLE_DATA = {
  cover: {
    title: "ARTIFICIAL INTELLIGENCE IN HEALTHCARE: A SYSTEMATIC REVIEW OF DIAGNOSTIC APPLICATIONS",
    authorName: "SARAH JAMES MITCHELL",
    registrationNo: "2023-PHD-CS-0047",
    degree: "Doctor of Philosophy",
    degreeAbbr: "PhD",
    subject: "Computer Science",
    department: "Department of Computer Science",
    university: "NATIONAL UNIVERSITY OF TECHNOLOGY",
    session: "2020–24",
    supervisor: "Prof. Dr. Robert A. Thompson",
    supervisorDesignation: "Professor & Head of Department",
    faculty: "Faculty of Engineering & Computer Science",
  },
  preliminary: {
    abstract: `This study presents a comprehensive systematic review of artificial intelligence (AI) applications in healthcare diagnostics, focusing on machine learning and deep learning methodologies deployed in clinical settings between 2015 and 2023. The research evaluates diagnostic accuracy, implementation challenges, and ethical considerations across radiology, pathology, and general clinical decision support systems.\n\nThe review identified 247 eligible studies from an initial pool of 3,842 records, following PRISMA guidelines. Findings indicate that convolutional neural networks (CNNs) demonstrate diagnostic accuracy comparable to specialist clinicians in image-based disciplines, achieving an average AUC of 0.94 across dermatology, radiology, and ophthalmology tasks.\n\nKey barriers to clinical adoption include data privacy concerns, algorithmic bias in underrepresented populations, regulatory uncertainty, and insufficient clinician training. The study recommends a staged implementation framework and calls for standardized reporting guidelines for AI diagnostic tools in peer-reviewed literature.`,
    acknowledgement: `I would like to express my deepest gratitude to my supervisor, Prof. Dr. Robert A. Thompson, whose expert guidance, patience, and unwavering encouragement made this research possible. His insightful feedback at every stage of the doctoral journey has been invaluable.\n\nI am grateful to the members of my doctoral committee for their constructive critique and scholarly rigor, which significantly strengthened this work. My sincere thanks also go to the staff of the university library and research computing center for their technical support throughout this project.\n\nFinally, I owe an immeasurable debt of gratitude to my family for their sacrifice, understanding, and constant moral support during the long years of this doctoral pursuit. This work is as much theirs as it is mine.`,
    dedication: "Dedicated to my parents, whose sacrifices made every page of this work possible.",
    declaration: `I hereby solemnly declare that this dissertation, titled "Artificial Intelligence in Healthcare: A Systematic Review of Diagnostic Applications," is the result of my own independent research and has not been submitted, either in whole or in part, for any other degree or qualification at this or any other academic institution.\n\nAll sources of information, data, and prior scholarship referenced in this work have been duly acknowledged in accordance with standard academic citation practice. Any similarity to previously published work is purely incidental and unintentional.\n\nI understand that any evidence of academic misconduct or plagiarism discovered at any stage — including after the award of the degree — may result in the revocation of the degree by the university authority.`,
  },
  chapters: [
    {
      id: 1,
      chapterNo: "01",
      title: "INTRODUCTION",
      epigraph: "The art of medicine consists of amusing the patient while nature cures the disease. — Voltaire",
      body: `Artificial intelligence (AI) has emerged as a transformative force across virtually every sector of modern society, and healthcare is no exception. Over the past decade, rapid advances in machine learning architectures, the exponential growth of digitized clinical data, and unprecedented computational power have collectively catalyzed a new era of intelligent diagnostic systems capable of rivaling — and in some domains surpassing — the diagnostic performance of trained specialists.\n\nThe intersection of AI and healthcare diagnostics represents one of the most consequential and contested frontiers in contemporary biomedical research. Proponents argue that AI-driven tools can democratize expert-level diagnosis, reduce human error, accelerate clinical workflows, and ultimately save lives. Critics, however, point to persistent concerns regarding algorithmic opacity, dataset bias, liability attribution, and the potential erosion of the physician–patient relationship.\n\nThis dissertation undertakes a systematic review of peer-reviewed literature published between January 2015 and December 2023, evaluating the evidence base for AI diagnostic applications across three primary clinical domains: radiology, pathology, and clinical decision support. The overarching goal is to produce a rigorous, balanced assessment that can inform both research priorities and healthcare policy.`,
      sections: [
        {
          id: 101,
          number: "1.1",
          heading: "Background and Motivation",
          content: `The global burden of diagnostic error is substantial. Estimates suggest that approximately 40,000 to 80,000 deaths occur annually in the United States alone due to diagnostic mistakes, with misdiagnosis rates reaching 10–15% in certain specialties. Simultaneously, specialist physician shortages in low- and middle-income countries mean that millions of patients receive no specialist review at all.\n\nArtificial intelligence, particularly deep learning, offers a theoretically scalable solution. Systems trained on millions of annotated images can be deployed at marginal cost, potentially extending specialist-grade diagnostic capability to underserved settings. It is this promise — and the gap between promise and clinical reality — that motivates the present systematic review.`,
          subsections: [
            {
              id: 1011,
              number: "1.1.1",
              heading: "Problem Statement",
              content: `Despite a proliferation of published AI diagnostic studies, translating research findings into validated clinical tools remains elusive. A 2021 meta-analysis by Liu et al. found that fewer than 0.5% of published AI diagnostic models had been prospectively validated in independent clinical cohorts. This implementation gap — the chasm between laboratory performance and real-world clinical utility — constitutes the central problem addressed by this review.\n\nThe study therefore poses the following primary research question: To what extent does the existing peer-reviewed evidence support the clinical deployment of AI-based diagnostic systems, and what structural barriers impede broader adoption?`
            },
            {
              id: 1012,
              number: "1.1.2",
              heading: "Scope and Delimitations",
              content: `This review is delimited to studies published in English in peer-reviewed journals indexed in PubMed, Scopus, or Web of Science between 2015 and 2023. Studies involving AI systems for therapeutic decision-making, drug discovery, or administrative healthcare functions are excluded. The review focuses exclusively on diagnostic performance outcomes, implementation feasibility, and ethical considerations.`
            }
          ]
        },
        {
          id: 102,
          number: "1.2",
          heading: "Research Objectives",
          content: `The present study pursues four inter-related objectives. First, to systematically identify and synthesize peer-reviewed evidence on the diagnostic accuracy of AI systems across clinical specialties. Second, to critically evaluate the methodological quality of included studies using validated appraisal instruments. Third, to identify structural, technical, and ethical barriers to clinical AI adoption reported in the literature. Fourth, to formulate evidence-based recommendations for future research, regulatory frameworks, and implementation strategy.`,
          subsections: []
        },
        {
          id: 103,
          number: "1.3",
          heading: "Significance of the Study",
          content: `This research contributes to the literature in three distinct ways. Methodologically, it applies a rigorous PRISMA-compliant systematic review protocol to a literature base that has hitherto been synthesized primarily through narrative reviews. Empirically, it provides updated quantitative estimates of AI diagnostic accuracy across specialties using pooled AUC meta-analysis. Practically, it delivers actionable guidance for clinicians, healthcare administrators, and policymakers navigating the AI adoption landscape.`,
          subsections: []
        }
      ],
      tables: [
        {
          id: 1001,
          caption: "Table 1.1: Summary of Clinical Domains and Number of Eligible Studies Identified per Domain",
          headers: ["Clinical Domain", "Studies Identified", "Studies Included", "Mean AUC (95% CI)"],
          rows: [
            ["Radiology", "1,204", "89", "0.95 (0.93–0.97)"],
            ["Pathology", "876", "64", "0.93 (0.91–0.95)"],
            ["Ophthalmology", "543", "41", "0.96 (0.94–0.98)"],
            ["Dermatology", "612", "38", "0.92 (0.89–0.95)"],
            ["Clinical Decision Support", "607", "15", "0.87 (0.83–0.91)"],
            ["Total", "3,842", "247", "0.94 (0.92–0.96)"]
          ]
        }
      ],
      figures: [
        {
          id: 2001,
          label: "Figure 1.1:",
          caption: "PRISMA Flow Diagram for Systematic Literature Search and Study Selection",
          description: "Flow diagram illustrating the four-phase PRISMA screening process: identification (3,842 records), screening (2,901 records after duplicate removal), eligibility assessment (412 full-text articles reviewed), and final inclusion (247 studies meeting all inclusion criteria)",
          imageData: null,
          imageName: null,
        }
      ]
    },
    {
      id: 2,
      chapterNo: "02",
      title: "LITERATURE REVIEW",
      epigraph: "",
      body: `This chapter provides a critical synthesis of prior scholarship relevant to the application of artificial intelligence in healthcare diagnostics. The review is organized thematically, progressing from foundational AI concepts and their medical applications, through to prior systematic reviews and meta-analyses, and culminating in a discussion of identified gaps that the present study addresses.\n\nThe volume of AI healthcare literature has grown exponentially since 2016, coinciding with the widespread adoption of deep learning architectures following the success of AlexNet in the 2012 ImageNet competition. This growth has been both a blessing — producing a rich empirical base — and a challenge, requiring systematic methods to distill signal from noise.`,
      sections: [
        {
          id: 201,
          number: "2.1",
          heading: "Foundations of Machine Learning in Medicine",
          content: `Machine learning, a sub-discipline of artificial intelligence, encompasses algorithms that learn statistical patterns from data without being explicitly programmed. In medical contexts, supervised learning — where algorithms are trained on labeled datasets of known diagnoses — has proven most directly applicable to diagnostic tasks.\n\nSeminal contributions include the work of Esteva et al. (2017), who demonstrated dermatologist-level classification of skin lesions using a CNN trained on 129,450 clinical images, and Rajpurkar et al. (2017), whose CheXNet model exceeded radiologist performance on pneumonia detection from chest X-rays. These studies established a template that has since been replicated across dozens of specialties.`,
          subsections: [
            {
              id: 2011,
              number: "2.1.1",
              heading: "Deep Learning Architectures",
              content: `Convolutional neural networks (CNNs) have dominated medical image analysis owing to their capacity to learn hierarchical spatial features directly from pixel data. Architectures such as ResNet, Inception, and EfficientNet — pre-trained on the ImageNet corpus and fine-tuned on domain-specific medical datasets — represent the current state of the art in image-based diagnostic AI.\n\nRecurrent neural networks (RNNs) and transformer-based models have demonstrated utility in processing sequential clinical data, including electronic health record (EHR) time series and natural language processing of unstructured clinical notes. The emergence of large language models (LLMs) such as GPT-4 and Med-PaLM 2 has further expanded the frontier of AI clinical reasoning.`
            }
          ]
        },
        {
          id: 202,
          number: "2.2",
          heading: "Prior Systematic Reviews and Meta-analyses",
          content: `Several systematic reviews have previously examined AI diagnostic performance in specific clinical domains. Liu et al. (2019) reviewed 82 studies comparing deep learning to clinicians in disease detection, finding equivalent or superior performance in 34 of 91 comparisons. Kim et al. (2022) conducted a meta-analysis of AI in radiological diagnosis, reporting a pooled sensitivity of 87.4% and specificity of 92.6% across 147 included studies.\n\nNotably, existing reviews have been criticized for methodological heterogeneity, selective outcome reporting, and failure to distinguish retrospective validation from prospective clinical deployment. The present review addresses these limitations through application of the QUADAS-2 risk-of-bias assessment tool and pre-registered PRISMA-compliant protocol.`,
          subsections: []
        }
      ],
      tables: [],
      figures: []
    }
  ],
  references: [
    "Esteva, A., Kuprel, B., Novoa, R. A., Ko, J., Swetter, S. M., Blau, H. M., & Thrun, S. (2017). Dermatologist-level classification of skin cancer with deep neural networks. Nature, 542(7639), 115–118. https://doi.org/10.1038/nature21056",
    "Kim, D. W., Jang, H. Y., Kim, K. W., Shin, Y., & Park, S. H. (2022). Design characteristics of studies reporting the performance of artificial intelligence algorithms for diagnostic analysis of medical images: Results from recently published papers. Korean Journal of Radiology, 20(3), 405–410.",
    "Liu, X., Faes, L., Kale, A. U., Wagner, S. K., Fu, D. J., Bruynseels, A., & Denniston, A. K. (2019). A comparison of deep learning performance against health-care professionals in detecting diseases from medical imaging: A systematic review and meta-analysis. The Lancet Digital Health, 1(6), e271–e297.",
    "Obermeyer, Z., & Emanuel, E. J. (2016). Predicting the future: Big data, machine learning, and clinical medicine. The New England Journal of Medicine, 375(13), 1216–1219.",
    "Rajpurkar, P., Irvin, J., Ball, R. L., Zhu, K., Yang, B., Mehta, H., & Lungren, M. P. (2017). CheXNet: Radiologist-level pneumonia detection on chest X-rays with deep learning. arXiv preprint arXiv:1711.05225.",
    "Shortliffe, E. H., & Sepúlveda, M. J. (2018). Clinical decision support in the era of artificial intelligence. JAMA, 320(21), 2199–2200.",
    "Topol, E. J. (2019). High-performance medicine: The convergence of human and artificial intelligence. Nature Medicine, 25(1), 44–56.",
    "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30, 5998–6008.",
    "World Health Organization. (2021). Ethics and governance of artificial intelligence for health: WHO guidance. World Health Organization.",
    "Zech, J. R., Badgeley, M. A., Liu, M., Costa, A. B., Titano, J. J., & Oermann, E. K. (2018). Variable generalization performance of a deep learning model to detect pneumonia in chest radiographs: A cross-sectional study. PLOS Medicine, 15(11), e1002686."
  ]
};
