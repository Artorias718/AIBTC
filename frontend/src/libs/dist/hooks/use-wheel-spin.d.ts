import type { WheelOfFortunePrize } from "../types/wheel-of-fortune-prize";
export declare function useWheelSpin(prizes: WheelOfFortunePrize[], onSpinStart: () => void, onSpinEnd: (prize: WheelOfFortunePrize) => void, animationDurationInMs: number, wheelRotationsCount: number, useProbabilitiesToCalculateWinner: boolean, defaultWinnerKey: string): {
    rotation: number;
    skipWheelAnimation: boolean;
    spin: () => void;
};
