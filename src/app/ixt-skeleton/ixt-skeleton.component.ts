import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Skeleton } from 'src/lib/skeleton/Skeleton';
import { Polygon } from 'src/lib/skeleton/Polygon';
import { Edge } from 'src/lib/skeleton/Edge';
import { Vector } from 'src/lib/skeleton/Vector';

interface SkeletonResults {
  angleBisectorEdges: Edge[];
  wavefrontPolygons: Polygon[];
  skeletonEdges: Edge[];
}

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

  // Skeleton computation results
  private currentResults: SkeletonResults | null = null;

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
      maxX: Math.max(...xs) + 1,
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  private drawResults() {
    if (!this.currentResults || !this.ctx) return;

    // Clear the canvas
    this.clearView();

    // Draw the original polygon first
    this.drawOriginalPolygon();

    const { angleBisectorEdges, wavefrontPolygons, skeletonEdges } = this.currentResults;

    // Draw wavefront polygons
    this.ctx.strokeStyle = this.COLORS.wavefront;
    this.ctx.lineWidth = 1;
    wavefrontPolygons.forEach(polygon => {
      this.ctx.beginPath();
      polygon.vertices.forEach((vertex, i) => {
        const pos = this.modelToScreen(vertex.position.x, vertex.position.y);
        if (i === 0) {
          this.ctx.moveTo(pos.x, pos.y);
        } else {
          this.ctx.lineTo(pos.x, pos.y);
        }
      });
      // Close the polygon
      if (polygon.vertices.length > 0) {
        const firstPos = this.modelToScreen(
          polygon.vertices[0].position.x,
          polygon.vertices[0].position.y
        );
        this.ctx.lineTo(firstPos.x, firstPos.y);
      }
      this.ctx.stroke();
    });

    // Draw angle bisectors
    this.ctx.strokeStyle = this.COLORS.bisector;
    this.ctx.lineWidth = 1;
    angleBisectorEdges.forEach(edge => {
      const start = this.modelToScreen(edge.v1.position.x, edge.v1.position.y);
      const end = this.modelToScreen(edge.v2.position.x, edge.v2.position.y);
      
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();

      // Draw small vertex at start point
      this.ctx.fillStyle = this.COLORS.bisector;
      this.ctx.fillRect(
        start.x - this.VERTEX_SIZE/4,
        start.y - this.VERTEX_SIZE/4,
        this.VERTEX_SIZE/2,
        this.VERTEX_SIZE/2
      );
    });

    // Draw skeleton edges
    this.ctx.strokeStyle = this.COLORS.original;
    this.ctx.lineWidth = 2;
    skeletonEdges.forEach(edge => {
      const start = this.modelToScreen(edge.v1.position.x, edge.v1.position.y);
      const end = this.modelToScreen(edge.v2.position.x, edge.v2.position.y);
      
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();

      // Draw intersection points
      this.ctx.fillStyle = this.COLORS.intersection;
      this.ctx.beginPath();
      this.ctx.arc(end.x, end.y, this.VERTEX_SIZE/3, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  computeSkeleton() {
    try {
      // Clear previous errors
      this.errors = [];
      
      // Parse input vertices
      console.log("Parsing vertex input:", this.vertexInput);
      const vertices = this.parseVertices(this.vertexInput);
      console.log("Parsed vertices:", vertices);
  
      // Create polygon
      const polygon = new Polygon(vertices.map(([x, y]) => new Vector(x, y)));
      console.log("Created polygon with", polygon.vertices.length, "vertices");
  
      // Build skeleton
      console.log("Building skeleton...");
      const skeleton = Skeleton.build(polygon);
  
      // Get debug logs
      console.log("Debug logs from skeleton construction:");
      skeleton.getDebugLog().forEach(log => console.log(log));
  
      // Get construction artifacts
      const angleBisectorEdges = skeleton.getAngleBisectors();
      const wavefrontPolygons = skeleton.getWavefrontPolygons();
      const skeletonEdges = skeleton.getSkeletonEdges();
  
      // Log results
      console.log("\nConstruction Results:");
      console.log(`Number of angle bisectors: ${angleBisectorEdges.length}`);
      console.log(`Number of wavefront polygons: ${wavefrontPolygons.length}`);
      console.log(`Number of skeleton edges: ${skeletonEdges.length}`);
  
      // Store results for visualization
      this.currentResults = {
        angleBisectorEdges,
        wavefrontPolygons,
        skeletonEdges
      };
  
      // Draw the results
      this.drawResults();
  
    } catch (error: any) {
      console.error("Error in skeleton computation:", error);
      this.errors.push(error.message);
      
      // If we have a stack trace, add it to the errors
      if (error.stack) {
        this.errors.push("Stack trace: " + error.stack);
      }
    }
  }

}