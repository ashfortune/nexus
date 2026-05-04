export type WorkerContractType =
    | "NO_PERIOD"
    | "PERIOD"
    | "MINOR"
    | "PART_TIME"
    | "CONSTRUCTION";

export type WorkerCalculateForm = {
    workerCount: string;
    dailyWorkHours: string;
    weeklyWorkDays: string;
    hourlyWage: string;
    workerType: string;
};

export type WorkerCalculateResponse = {
    weeklyAllowance: {
        applicable: boolean;
        amount: number;
        reason: string;
    };
    breakTime: {
        required: boolean;
        duration: string;
        reason: string;
    };
    insurance: {
        required: boolean;
        types: string[];
        reason: string;
    };
};

export type WorkerContractRequest = {
    contractType: WorkerContractType;

    employerName: string;
    employerPhone: string;
    employerAddress: string;
    representativeName: string;

    workerName: string;
    workerAddress: string;
    workerPhone: string;

    startDate: string;
    endDate: string;

    workplace: string;
    jobDescription: string;

    workStartTime: string;
    workEndTime: string;
    breakStartTime: string;
    breakEndTime: string;

    dailyWorkHours: string;
    weeklyWorkHours: string;
    weeklyWorkDays: string;
    weeklyHoliday: string;

    wage: string;
    wageType: string;
    hasBonus: boolean;
    bonusAmount: string;
    hasExtraAllowance: boolean;

    paymentDay: string;
    paymentMethod: string;
    contractDate: string;
};