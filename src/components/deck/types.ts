export type Flashcard = {
    q: string;
    a: string;
    refs: number[];
    difficulty: "easy" | "medium" | "hard";
};

export type ExamQuestion = {
    id: string;
    type: "mcq" | "short";
    question: string;
    choices?: string[];
    answer: string;
    explanation: string;
    refs: number[];
    difficulty: "easy" | "medium" | "hard";
};

export type Exam = {
    title: string;
    instructions: string;
    questions: ExamQuestion[];
};

export type ExamProgress = {
    selected?: string;
    shortText?: string;
    graded?: boolean;
    correct?: boolean;
};
