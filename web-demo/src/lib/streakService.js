const getToday = () => new Date().toISOString().split("T")[0];


let state = {
  currentStreak: 0,
  lastCompletedDate: null,
  todayProgress: {
    date: getToday(),
    completedSessions: 0,
    dailyGoal: 3,
    isGoalCompleted: false,
  },
};

export const streakService = {
    getState() {
        return state;
    },

    updateAfterSession() {
        const today = getToday();

        
        if (state.todayProgress.date !== today) {
            state.todayProgress = {
                date: today,
                completedSessions: 0,
                dailyGoal: state.todayProgress.dailyGoal,
                isGoalCompleted: false,
            };
        }

        state.todayProgress.completedSessions += 1;

        
        if (
            state.todayProgress.completedSessions >= state.todayProgress.dailyGoal &&
            !state.todayProgress.isGoalCompleted
        ) {
            state.todayProgress.isGoalCompleted = true;

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split("T")[0];

            if (state.lastCompletedDate === yStr) {
                state.currentStreak += 1;
            } else {
                state.currentStreak = 1;
            }

            state.lastCompletedDate = today;
        }

        return { ...state };
    },

    reset() {
        state = {
            currentStreak: 0,
            lastCompletedDate: null,
            todayProgress: {
                date: getToday(),
                completedSessions: 0,
                dailyGoal: 3,
                isGoalCompleted: false,
            },
        };
    },
};