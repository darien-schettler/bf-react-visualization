import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const BrainfuckDashboard = () => {
  const initialCode = '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.';
  const initialMemory = Array(30).fill(0);

  const [code, setCode] = useState(initialCode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [memory, setMemory] = useState(initialMemory);
  const [pointer, setPointer] = useState(0);
  const [delay, setDelay] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [asciiValue, setAsciiValue] = useState({ int: 0, char: '' });

  const canvasRef = useRef(null);
  const timeoutRef = useRef(null);

  const updateVisualization = useCallback(() => {
    setMemory(initialMemory);
    setPointer(0);
    setOutput('');
    setAsciiValue({ int: 0, char: '' });
    drawCode(-1);
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [code, updateVisualization]);

  const drawCode = useCallback((highlightIndex) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = 16;
    const lineHeight = 20;
    const charsPerLine = Math.floor(canvas.width / (fontSize * 0.6));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = 'black';

    for (let i = 0; i < code.length; i++) {
      const x = (i % charsPerLine) * fontSize * 0.6;
      const y = Math.floor(i / charsPerLine) * lineHeight + fontSize;

      if (i === highlightIndex) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(x, y - fontSize, fontSize * 0.6, fontSize);
        ctx.fillStyle = 'black';
      }

      ctx.fillText(code[i], x, y);
    }
  }, [code]);

  const interpret = async () => {
    setIsRunning(true);
    let result = '';
    let i = 0;
    const stack = [];
    const inp = input.split('');
    const mem = [...initialMemory];
    let ptr = 0;

    const step = async () => {
      if (i >= code.length) {
        setIsRunning(false);
        drawCode(-1);
        return;
      }

      drawCode(i);
      setPointer(ptr);
      setMemory([...mem]);
      setAsciiValue({ int: mem[ptr], char: String.fromCharCode(mem[ptr]) });

      switch (code[i]) {
        case '>':
          ptr = (ptr + 1) % mem.length;
          break;
        case '<':
          ptr = (ptr - 1 + mem.length) % mem.length;
          break;
        case '+':
          mem[ptr] = (mem[ptr] + 1) % 256;
          break;
        case '-':
          mem[ptr] = (mem[ptr] - 1 + 256) % 256;
          break;
        case '.':
          result += String.fromCharCode(mem[ptr]);
          setOutput(result);
          break;
        case ',':
          mem[ptr] = inp.shift()?.charCodeAt(0) || 0;
          break;
        case '[':
          if (mem[ptr] === 0) {
            let loop = 1;
            while (loop > 0) {
              i++;
              if (code[i] === '[') loop++;
              if (code[i] === ']') loop--;
            }
          } else {
            stack.push(i);
          }
          break;
        case ']':
          if (mem[ptr] !== 0) {
            i = stack[stack.length - 1];
          } else {
            stack.pop();
          }
          break;
      }

      i++;
      timeoutRef.current = setTimeout(step, delay);
    };

    await step();
  };

  const stopExecution = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsRunning(false);
    drawCode(-1);
  };

  const resetDashboard = () => {
    stopExecution();
    setCode(initialCode);
    setInput('');
    updateVisualization();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Canvas-Based Brainfuck Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brainfuck Code:</label>
              <Textarea 
                value={code} 
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-sm"
                rows={5}
              />
            </div>
            <div>
              <canvas 
                ref={canvasRef}
                width={600}
                height={200}
                className="border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input:</label>
              <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" />
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <Button onClick={interpret} disabled={isRunning}>Run</Button>
              <Button onClick={stopExecution} disabled={!isRunning}>Stop</Button>
              <Button onClick={resetDashboard}>Reset</Button>
              <Button onClick={updateVisualization}>Update Visualization</Button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Execution Speed:</label>
              <Slider
                value={[delay]}
                onValueChange={(value) => setDelay(value[0])}
                min={1}
                max={500}
                step={1}
                className="mt-1"
              />
              <span className="text-sm text-gray-500">{delay}ms delay</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current ASCII Value:</label>
              <div className="mt-1 p-2 border rounded-md bg-white">
                Integer: <span className="font-mono">{asciiValue.int}</span>, Character: '<span className="font-mono">{asciiValue.char}</span>'
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output:</label>
              <div className="mt-1 p-2 border rounded-md min-h-[50px] bg-white font-mono">{output}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Memory Visualization:</label>
              <div className="mt-1 flex flex-wrap gap-2 p-4 bg-gray-100 rounded-md overflow-x-auto">
                {memory.map((value, index) => (
                  <div 
                    key={index} 
                    className={`w-12 h-12 rounded-md flex flex-col items-center justify-center text-sm transition-all duration-200 ${
                      index === pointer ? 'bg-blue-500 text-white shadow-md transform scale-110' : 'bg-white'
                    }`}
                    title={`Cell ${index}: ${value}`}
                  >
                    <div className="font-bold">{value}</div>
                    <div className="text-xs opacity-50">#{index}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Brainfuck Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">&gt;</code>: Move the pointer right</li>
            <li><code className="bg-gray-100 px-1 rounded">&lt;</code>: Move the pointer left</li>
            <li><code className="bg-gray-100 px-1 rounded">+</code>: Increment the memory cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">-</code>: Decrement the memory cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">.</code>: Output the character signified by the cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">,</code>: Input a character and store it in the cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">[</code>: Jump past the matching <code className="bg-gray-100 px-1 rounded">]</code> if the cell at the pointer is 0</li>
            <li><code className="bg-gray-100 px-1 rounded">]</code>: Jump back to the matching <code className="bg-gray-100 px-1 rounded">[</code> if the cell at the pointer is nonzero</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrainfuckDashboard;
