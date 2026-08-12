import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentProfileCard } from '../components/search/StudentProfileCard';

describe('StudentProfileCard', () => {
  it('summarizes a student and their exam schedule', () => {
    render(<StudentProfileCard studentId="653380123-4" branch="CS" examsCount={4} roomsCount={2} daysCount={3} />);

    expect(screen.getByText('653380123-4')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('รายวิชา')).toBeInTheDocument();
  });

  it('does not render an empty branch badge', () => {
    render(<StudentProfileCard studentId="653380123-4" branch="" examsCount={0} roomsCount={0} daysCount={0} />);

    expect(screen.queryByText('CS')).not.toBeInTheDocument();
  });
});
