/**
 * Chart Card Component
 * ====================
 * Wrapper component for Chart.js charts.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from 'chart.js';

import { TimeSeriesData, ChartDataPoint } from '../../services/admin-dashboard.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'smc-chart-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './chart-card.component.html',
  styleUrl: './chart-card.component.scss',
    .chart-card {
      border-radius: 16px;
      overflow: hidden;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem 1.25rem 0;
    }

    .chart-title {
      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
      }

      .subtitle {
        font-size: 0.75rem;
        color: #999;
      }
    }

    .chart-container {
      padding: 1rem;
      height: 300px;

      canvas {
        max-width: 100%;
        max-height: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCardComponent implements AfterViewInit, OnDestroy {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly chartType = input<'line' | 'bar' | 'doughnut' | 'pie'>('line');
  readonly timeSeriesData = input<TimeSeriesData | null>(null);
  readonly pieData = input<ChartDataPoint[]>([]);

  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const tsData = this.timeSeriesData();
      const pData = this.pieData();

      if (this.chart) {
        this.updateChart(tsData, pData);
      }
    });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = this.getChartConfig();
    this.chart = new Chart(ctx, config);
  }

  private updateChart(tsData: TimeSeriesData | null, pData: ChartDataPoint[]): void {
    if (!this.chart) return;

    const type = this.chartType();

    if (type === 'doughnut' || type === 'pie') {
      if (pData.length > 0) {
        this.chart.data.labels = pData.map((d) => d.label);
        this.chart.data.datasets[0].data = pData.map((d) => d.value);
      }
    } else if (tsData) {
      this.chart.data.labels = tsData.labels;
      this.chart.data.datasets = tsData.datasets.map((ds, i) => ({
        ...this.chart!.data.datasets[i],
        ...ds,
      }));
    }

    this.chart.update();
  }

  private getChartConfig(): ChartConfiguration {
    const type = this.chartType();
    const tsData = this.timeSeriesData();
    const pData = this.pieData();

    if (type === 'doughnut' || type === 'pie') {
      return this.getPieConfig(pData);
    }

    return this.getLineBarConfig(type, tsData);
  }

  private getLineBarConfig(
    type: 'line' | 'bar',
    data: TimeSeriesData | null
  ): ChartConfiguration {
    const colors = [
      { border: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
      { border: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' },
      { border: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' },
      { border: '#9c27b0', bg: 'rgba(156, 39, 176, 0.1)' },
    ];

    return {
      type,
      data: {
        labels: data?.labels || [],
        datasets:
          data?.datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.borderColor || colors[i % colors.length].border,
            backgroundColor: ds.backgroundColor || colors[i % colors.length].bg,
            borderWidth: 2,
            fill: type === 'line',
            tension: 0.4,
            pointRadius: type === 'line' ? 4 : 0,
            pointHoverRadius: type === 'line' ? 6 : 0,
          })) || [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 12 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { font: { size: 11 } },
          },
        },
      },
    };
  }

  private getPieConfig(data: ChartDataPoint[]): ChartConfiguration {
    const colors = [
      '#4caf50',
      '#2196f3',
      '#ff9800',
      '#9c27b0',
      '#f44336',
      '#00bcd4',
      '#795548',
      '#607d8b',
    ];

    return {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.value),
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 12,
              font: { size: 11 },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
          },
        },
      },
    };
  }
}

