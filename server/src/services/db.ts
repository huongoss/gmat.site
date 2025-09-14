// MongoDB helpers via Mongoose
import { User } from '../models/User';
import Question from '../models/Question';
import Result from '../models/Result';

export const getUserById = async (id: string) => {
  return User.findById(id).lean();
};

export const createUser = async (userData: { username: string; email?: string; password: string }) => {
  const user = new User({
    username: userData.username,
    email: userData.email,
    password: userData.password,
  });
  await user.save();
  return user.toObject();
};

export const getQuestions = async (limit = 10) => {
  return Question.find().limit(limit).lean();
};

export const saveResult = async (resultData: {
  userId: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
}) => {
  const result = new Result({
    userId: resultData.userId,
    score: resultData.score,
    questionsAnswered: resultData.questionsAnswered,
    correctAnswers: resultData.correctAnswers,
  });
  await result.save();
  return result.toObject();
};

export const getResultsByUserId = async (userId: string) => {
  return Result.find({ userId }).lean();
};