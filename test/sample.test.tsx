import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Simple component for testing infrastructure validation
const HelloWorld: React.FC<{ name: string }> = ({ name }) => (
    <div>Hello, {name}!</div>
);

describe('Testing Infrastructure', () => {
    it('should render a component correctly', () => {
        render(<HelloWorld name="EcoConnect" />);
        expect(screen.getByText('Hello, EcoConnect!')).toBeInTheDocument();
    });

    it('should have correct testing utilities', () => {
        expect(typeof describe).toBe('function');
        expect(typeof it).toBe('function');
        expect(typeof expect).toBe('function');
    });
});
