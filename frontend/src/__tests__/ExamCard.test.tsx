import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExamCard } from '../components/exam/ExamCard';
import type { ExamResult, RoomConfigMap } from '../types';

describe('ExamCard', () => {
  const mockExam: ExamResult = {
    sheet: '1',
    date: 'Wednesday, June 10',
    time: '09:00 - 12:00',
    room: 'CP.9127',
    subject: 'CP101',
    subject_name: 'Introduction to Computer Science',
    section: '1',
    student_id: '653380123-4',
    seat: 'A25',
    note: '',
  };

  const mockConfigMap: RoomConfigMap = {
    'CP.9127': {
      layout: [
        {
          type: 'column',
          label: 'A',
          items: [
            {
              type: 'seats',
              char: 'A',
              count: 30,
            },
          ],
        },
      ],
    },
  };

  it('renders exam details correctly', () => {
    render(
      <ExamCard
        data={mockExam}
        configMap={mockConfigMap}
        subjectName={mockExam.subject_name}
      />
    );

    // Assert subject name is shown
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    expect(screen.getByText('CP101')).toBeInTheDocument();
    expect(screen.getByText('Sec.1')).toBeInTheDocument();

    // Assert date and time are shown
    expect(screen.getByText('Wednesday, June 10')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument();

    // Assert room and seat are shown
    expect(screen.getByText('CP.9127')).toBeInTheDocument();
    expect(screen.getAllByText('A25')[0]).toBeInTheDocument();
  });

  it('shows no model preview when room has no config', () => {
    render(
      <ExamCard
        data={mockExam}
        configMap={{}} // Empty config map
      />
    );

    expect(screen.getByText('ไม่มีผังแบบจำลอง')).toBeInTheDocument();
  });

  it('triggers onViewMap and onJumpToExplorer callbacks when clicked', () => {
    const onViewMapMock = vi.fn();
    const onJumpToExplorerMock = vi.fn();

    render(
      <ExamCard
        data={mockExam}
        configMap={mockConfigMap}
        onViewMap={onViewMapMock}
        onJumpToExplorer={onJumpToExplorerMock}
      />
    );

    // Get and click "ค้นหาแผนที่ห้องสอบ" button
    const explorerBtn = screen.getByRole('button', { name: /ค้นหาแผนที่ห้องสอบ/i });
    fireEvent.click(explorerBtn);
    expect(onJumpToExplorerMock).toHaveBeenCalledTimes(1);

    // Get and click "ดูแผนผังห้องสอบ (รูปภาพ)" button
    const mapBtn = screen.getByRole('button', { name: /ดูแผนผังห้องสอบ \(รูปภาพ\)/i });
    fireEvent.click(mapBtn);
    expect(onViewMapMock).toHaveBeenCalledTimes(1);
  });
});
