import type { Requirement, UseCase, TestCase, Information, Risk } from './artifact';

export interface GlobalState {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
  risks: Risk[];
}
