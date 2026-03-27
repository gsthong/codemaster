import { RootLayout } from '@/components/layout/RootLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, BarChart3 } from 'lucide-react';

export default function MockExamsPage() {
  const mockExams = [
    {
      id: 1,
      title: 'Arrays & Hashing - Basic',
      difficulty: 'Easy',
      duration: 30,
      problems: 5,
      completed: true,
      score: 100
    },
    {
      id: 2,
      title: 'Binary Search Challenge',
      difficulty: 'Medium',
      duration: 45,
      problems: 8,
      completed: false,
      score: null
    },
    {
      id: 3,
      title: 'Dynamic Programming Masterclass',
      difficulty: 'Hard',
      duration: 90,
      problems: 12,
      completed: false,
      score: null
    }
  ];

  return (
    <RootLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Mock Exams</h1>
          <p className="text-foreground/60">Test your skills with timed coding challenges</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-card border border-border">
            <Trophy className="w-8 h-8 text-accent mb-2" />
            <p className="text-sm text-foreground/60 mb-1">Exams Completed</p>
            <p className="text-3xl font-bold text-foreground">1</p>
          </Card>
          <Card className="p-6 bg-card border border-border">
            <BarChart3 className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm text-foreground/60 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-foreground">100%</p>
          </Card>
          <Card className="p-6 bg-card border border-border">
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-sm text-foreground/60 mb-1">Time Saved</p>
            <p className="text-3xl font-bold text-foreground">5 min</p>
          </Card>
        </div>

        <div className="space-y-4">
          {mockExams.map(exam => (
            <Card key={exam.id} className="p-6 bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{exam.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      exam.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      exam.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {exam.difficulty}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm text-foreground/60">
                    <span>⏱️ {exam.duration} min</span>
                    <span>📝 {exam.problems} problems</span>
                    {exam.completed && <span className="text-green-400">✓ Completed • Score: {exam.score}%</span>}
                  </div>
                </div>
                <Button
                  className={exam.completed ? 'bg-secondary hover:bg-secondary/90' : 'bg-primary hover:bg-primary/90'}
                >
                  {exam.completed ? 'Review' : 'Start Exam'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RootLayout>
  );
}
