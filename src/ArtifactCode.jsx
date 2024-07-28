import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const examples = {
  helloWorld: '++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.',
  catProgram: '>,[>,]<[<]>[.>]',
  additionExample: '+++++>+++[<+>-]',
  multiplicationExample: '+++[>+++++<-]',
  ifStatementExample: ',[>>+>+<<<-]>>>[<<<+>>>-]>+<<[-----[>]>>[<<<+++>>>[-]]'
};

const exampleDescriptions = {
  helloWorld: "Prints 'Hello World!'",
  catProgram: "Reads input and prints it back (like the UNIX cat command)",
  additionExample: "Adds 5 and 3",
  multiplicationExample: "Multiplies 3 by 5",
  ifStatementExample: "If input equals 5, set y to 3 (non-destructive flow control)"
};

const BrainfuckDashboard = () => {
  const [code, setCode] = useState(examples.helloWorld);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [memory, setMemory] = useState(Array(30).fill(0));
  const [pointer, setPointer] = useState(0);
  const [delay, setDelay] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [asciiValue, setAsciiValue] = useState({ int: 0, char: '' });

  const canvasRef = useRef(null);
  const timeoutRef = useRef(null);

  const updateVisualization = useCallback(() => {
    setMemory(Array(30).fill(0));
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
    const mem = [...memory];
    let ptr = pointer;

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
          <CardTitle>Enhanced Interactive Brainfuck Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Example:</label>
              <Select onValueChange={(value) => setCode(examples[value])}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an example" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(examples).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {exampleDescriptions[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <CardTitle>Brainfuck Basics and Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Brainfuck is an esoteric programming language created by Urban Müller. It consists of only eight simple commands, a data pointer and an array of memory cells initialized to zero.</p>
          
          <h3 className="text-lg font-semibold mb-2">Commands:</h3>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><code className="bg-gray-100 px-1 rounded">&gt;</code>: Move the pointer right</li>
            <li><code className="bg-gray-100 px-1 rounded">&lt;</code>: Move the pointer left</li>
            <li><code className="bg-gray-100 px-1 rounded">+</code>: Increment the memory cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">-</code>: Decrement the memory cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">.</code>: Output the character signified by the cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">,</code>: Input a character and store it in the cell at the pointer</li>
            <li><code className="bg-gray-100 px-1 rounded">[</code>: Jump past the matching <code className="bg-gray-100 px-1 rounded">]</code> if the cell at the pointer is 0</li>
            <li><code className="bg-gray-100 px-1 rounded">]</code>: Jump back to the matching <code className="bg-gray-100 px-1 rounded">[</code> if the cell at the pointer is nonzero</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">Example Functionalities:</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li><strong>Hello World:</strong> A classic program that outputs "Hello World!"</li>
            <li><strong>Cat Program:</strong> Reads input and prints it back, similar to the UNIX cat command</li>
            <li><strong>Addition:</strong> Demonstrates how to perform addition in Brainfuck</li>
            <li><strong>Multiplication:</strong> Shows how to multiply two numbers</li>
            <li><strong>If Statement:</strong> Implements a basic if statement using non-destructive flow control</li>
          </ul>

          <p className="text-sm italic">Thanks to Katie for the comprehensive Brainfuck tutorial and examples. For more information, visit <a href="https://gist.github.com/roachhd/dce54bec8ba55fb17d3a" className="text-blue-500 hover:underline">Katie's Brainfuck Tutorial</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrainfuckDashboard;
