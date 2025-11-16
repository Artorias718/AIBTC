import type { WheelOfFortunePrize } from "../types/wheel-of-fortune-prize";
export declare const getFixedPrizeWinner: (prizeWinnerKey: string, prizes: WheelOfFortunePrize[]) => [number, WheelOfFortunePrize | null];
export declare const getWeightedPrizeWinner: (prizes: WheelOfFortunePrize[]) => [number, WheelOfFortunePrize | null];
export declare const getRandomPrizeWinner: (prizes: WheelOfFortunePrize[]) => [number, WheelOfFortunePrize | null];
