export interface Category {
  _id: string;
  name: string;
}

export type FoodStatus = 'bladder_friendly' | 'worth_try' | 'avoid';

export interface FoodType {
  _id: string;
  name: string;
  status: FoodStatus;
  note: string;
  food_id: string;
}

export interface Food {
  _id: string;
  name: string;
  note: string;
  cate_id: string;
  types: FoodType[];
}

export interface SearchResult {
  food: string;
  food_note: string;
  type: string;
  type_note: string;
  status: FoodStatus;
}

export type StatusFilter = 'all' | FoodStatus;

export type RootStackParamList = {
  Splash: undefined;
  Categories: undefined;
  Foods: { categoryId: string; categoryName: string };
  FoodSearch: undefined;
  AIHelp: undefined;
};
