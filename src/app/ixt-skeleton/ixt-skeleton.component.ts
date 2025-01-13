import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Skeleton } from 'src/lib/skeleton/Skeleton';
import { Polygon } from 'src/lib/skeleton/Polygon';
import { Edge } from 'src/lib/skeleton/Edge';
import { Vector } from 'src/lib/skeleton/Vector';

@Component({
  selector: 'ixt-skeleton',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ixt-skeleton.component.html',
  styleUrls: ['./ixt-skeleton.component.scss']
})
export class IxtSkeletonComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Default vertices for a 8x5 rectangle
  vertexInput: string = '{(0,0),(8,0),(8,5),(0,5)}';
  errors: string[] = [];

  // Drawing constants
  private readonly COLORS = {
    original: '#FF0000',
    wavefront: '#0000FF',
    intersection: '#FFFF00',
    bisector: '#800080',
    text: '#000000'
  };

  private readonly VERTEX_SIZE = 6; // Size in screen pixels

  // Transform state
  private modelTransform = {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  };

  ngOnInit() {
    this.validateInput();
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.drawOriginalPolygon();
  }

  clearView() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.errors = [];
  }

  private validateInput(): boolean {
    this.errors = [];
    try {
      const vertices = this.parseVertices(this.vertexInput);
      if (vertices.length < 3) {
        this.errors.push('Polygon must have at least 3 vertices');
        return false;
      }
      return true;
    } catch (e) {
      this.errors.push(`Parse error: ${e}`);
      return false;
    }
  }

  private parseVertices(input: string): [number, number][] {
    // Remove spaces and brackets
    const cleaned = input.replace(/\s/g, '').replace('{', '').replace('}', '');
    // Split into coordinate pairs
    const pairs = cleaned.split('),(');
    
    return pairs.map(pair => {
      const [x, y] = pair
        .replace('(', '')
        .replace(')', '')
        .split(',')
        .map(Number);
        
      if (isNaN(x) || isNaN(y)) {
        throw new Error('Invalid coordinate pair');
      }
      return [x, y];
    });
  }

  drawOriginalPolygon() {
    if (!this.validateInput()) return;

    this.clearView();
    const vertices = this.parseVertices(this.vertexInput);
    
    // Calculate model bounds
    const bounds = this.calculateBounds(vertices);
    const viewportPadding = 40;
    
    // Setup viewport transform
    const viewWidth = this.canvasRef.nativeElement.width - 2 * viewportPadding;
    const viewHeight = this.canvasRef.nativeElement.height - 2 * viewportPadding;
    
    // Calculate scale to fit bounds in viewport
    const scaleX = viewWidth / (bounds.maxX - bounds.minX);
    const scaleY = viewHeight / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY);
    
    // Store transform for coordinate conversion
    this.modelTransform = {
        scale: scale,
        offsetX: this.canvasRef.nativeElement.width / 2 - scale * (bounds.minX + (bounds.maxX - bounds.minX) / 2),
        offsetY: this.canvasRef.nativeElement.height / 2 + scale * (bounds.minY + (bounds.maxY - bounds.minY) / 2)
    };

    // Draw polygon edges
    this.ctx.strokeStyle = this.COLORS.original;
    this.ctx.lineWidth = 1;  // 1 pixel in screen space
    this.ctx.beginPath();
    
    vertices.forEach((vertex, i) => {
        const screenPos = this.modelToScreen(vertex[0], vertex[1]);
        if (i === 0) {
            this.ctx.moveTo(screenPos.x, screenPos.y);
        } else {
            this.ctx.lineTo(screenPos.x, screenPos.y);
        }
    });
    
    // Close the polygon
    const firstPos = this.modelToScreen(vertices[0][0], vertices[0][1]);
    this.ctx.lineTo(firstPos.x, firstPos.y);
    this.ctx.stroke();

    // Draw vertices
    vertices.forEach(([x, y]) => {
        this.drawVertex(x, y, this.COLORS.original);
        this.drawCoordinateText(x, y);
    });
  }

  private modelToScreen(x: number, y: number) {
    return {
        x: this.modelTransform.offsetX + this.modelTransform.scale * x,
        y: this.modelTransform.offsetY - this.modelTransform.scale * y
    };
  }

  private drawVertex(x: number, y: number, color: string) {
    const screenPos = this.modelToScreen(x, y);
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
        screenPos.x - this.VERTEX_SIZE/2,
        screenPos.y - this.VERTEX_SIZE/2,
        this.VERTEX_SIZE,
        this.VERTEX_SIZE
    );
  }

  private drawCoordinateText(x: number, y: number) {
    const screenPos = this.modelToScreen(x, y);
    const text = `(${x.toFixed(1)},${y.toFixed(1)})`;
    
    this.ctx.fillStyle = this.COLORS.text;
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, screenPos.x + 8, screenPos.y);
  }

  private calculateBounds(vertices: [number, number][]) {
    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs)+1,  //hmmm?
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  computeSkeleton() {
    try {
      const vertices = this.parseVertices(this.vertexInput);
      const polygon = new Polygon(vertices.map(([x, y]) => new Vector(x, y)));
      const skeleton = Skeleton.build(polygon);
      const edges = skeleton.getEdges();
      console.log(`Number of edges: ${edges.length}`);
      edges.forEach(edge => console.log(edge));
    } catch (error: any) {
      this.errors.push(error.message);
    }
  }
}
