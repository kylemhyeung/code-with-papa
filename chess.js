class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.init();
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = 'P'; // white pawns
            board[6][i] = 'p'; // black pawns
        }

        // Place pieces
        const piecesSetup = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
        piecesSetup.forEach((piece, index) => {
            board[0][index] = piece; // white pieces
            board[7][index] = piece.toLowerCase(); // black pieces
        });

        return board;
    }

    init() {
        this.renderBoard();
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
    }

    reset() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.renderBoard();
        this.updateStatus();
    }

    renderBoard() {
        const boardDiv = document.getElementById('board');
        boardDiv.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                const isLight = (row + col) % 2 === 0;
                square.className = `square ${isLight ? 'light' : 'dark'}`;
                
                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.getPieceSymbol(piece);
                }

                // Highlight selected square
                if (this.selectedSquare && this.selectedSquare[0] === row && this.selectedSquare[1] === col) {
                    square.classList.add('selected');
                }

                // Highlight valid moves
                if (this.validMoves.some(m => m[0] === row && m[1] === col)) {
                    square.classList.add('highlight');
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardDiv.appendChild(square);
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            'P': '♙', 'p': '♟',
            'R': '♖', 'r': '♜',
            'N': '♘', 'n': '♞',
            'B': '♗', 'b': '♝',
            'Q': '♕', 'q': '♛',
            'K': '♔', 'k': '♚'
        };
        return symbols[piece] || '';
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;

        const piece = this.board[row][col];
        const isWhite = piece && piece === piece.toUpperCase();
        const isCurrentPlayer = (this.currentPlayer === 'white' && isWhite) || (this.currentPlayer === 'black' && !isWhite);

        // If clicking on a piece of current player
        if (piece && isCurrentPlayer) {
            this.selectedSquare = [row, col];
            this.validMoves = this.getValidMoves(row, col);
            this.renderBoard();
            return;
        }

        // If a square is selected and clicking on a valid move
        if (this.selectedSquare && this.validMoves.some(m => m[0] === row && m[1] === col)) {
            this.movePiece(this.selectedSquare[0], this.selectedSquare[1], row, col);
            this.selectedSquare = null;
            this.validMoves = [];
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.renderBoard();
            this.updateStatus();
            return;
        }

        // Deselect if clicking elsewhere
        this.selectedSquare = null;
        this.validMoves = [];
        this.renderBoard();
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];
        const type = piece.toUpperCase();
        const isWhite = piece === piece.toUpperCase();

        switch (type) {
            case 'P':
                moves.push(...this.getPawnMoves(row, col, isWhite));
                break;
            case 'R':
                moves.push(...this.getRookMoves(row, col, isWhite));
                break;
            case 'N':
                moves.push(...this.getKnightMoves(row, col, isWhite));
                break;
            case 'B':
                moves.push(...this.getBishopMoves(row, col, isWhite));
                break;
            case 'Q':
                moves.push(...this.getQueenMoves(row, col, isWhite));
                break;
            case 'K':
                moves.push(...this.getKingMoves(row, col, isWhite));
                break;
        }

        return moves.filter(m => this.isValidMove(row, col, m[0], m[1], isWhite));
    }

    getPawnMoves(row, col, isWhite) {
        const moves = [];
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;

        // Forward move
        const nextRow = row + direction;
        if (this.isInBounds(nextRow, col) && !this.board[nextRow][col]) {
            moves.push([nextRow, col]);

            // Double move from start
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }

        // Captures
        for (let dc of [-1, 1]) {
            const nc = col + dc;
            const nr = nextRow;
            if (this.isInBounds(nr, nc)) {
                const targetPiece = this.board[nr][nc];
                if (targetPiece && (targetPiece === targetPiece.toUpperCase()) !== isWhite) {
                    moves.push([nr, nc]);
                }
            }
        }

        return moves;
    }

    getRookMoves(row, col, isWhite) {
        return this.getStraightMoves(row, col, isWhite);
    }

    getBishopMoves(row, col, isWhite) {
        return this.getDiagonalMoves(row, col, isWhite);
    }

    getQueenMoves(row, col, isWhite) {
        return [...this.getStraightMoves(row, col, isWhite), ...this.getDiagonalMoves(row, col, isWhite)];
    }

    getKingMoves(row, col, isWhite) {
        const moves = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (this.isInBounds(nr, nc) && this.canCapture(nr, nc, isWhite)) {
                    moves.push([nr, nc]);
                }
            }
        }
        return moves;
    }

    getKnightMoves(row, col, isWhite) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        knightMoves.forEach(([dr, dc]) => {
            const nr = row + dr;
            const nc = col + dc;
            if (this.isInBounds(nr, nc) && this.canCapture(nr, nc, isWhite)) {
                moves.push([nr, nc]);
            }
        });
        
        return moves;
    }

    getStraightMoves(row, col, isWhite) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([dr, dc]) => {
            for (let i = 1; i < 8; i++) {
                const nr = row + i * dr;
                const nc = col + i * dc;
                if (!this.isInBounds(nr, nc)) break;
                if (!this.board[nr][nc]) {
                    moves.push([nr, nc]);
                } else if (this.canCapture(nr, nc, isWhite)) {
                    moves.push([nr, nc]);
                    break;
                } else {
                    break;
                }
            }
        });
        
        return moves;
    }

    getDiagonalMoves(row, col, isWhite) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([dr, dc]) => {
            for (let i = 1; i < 8; i++) {
                const nr = row + i * dr;
                const nc = col + i * dc;
                if (!this.isInBounds(nr, nc)) break;
                if (!this.board[nr][nc]) {
                    moves.push([nr, nc]);
                } else if (this.canCapture(nr, nc, isWhite)) {
                    moves.push([nr, nc]);
                    break;
                } else {
                    break;
                }
            }
        });
        
        return moves;
    }

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    canCapture(row, col, isWhite) {
        const piece = this.board[row][col];
        if (!piece) return true;
        return (piece === piece.toUpperCase()) !== isWhite;
    }

    isValidMove(fromRow, fromCol, toRow, toCol, isWhite) {
        // Simulate the move to check for check
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        const inCheck = this.isKingInCheck(isWhite);
        
        this.board[fromRow][fromCol] = piece;
        this.board[toRow][toCol] = captured;
        
        return !inCheck;
    }

    isKingInCheck(isWhite) {
        let kingPos = null;
        const kingChar = isWhite ? 'K' : 'k';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === kingChar) {
                    kingPos = [r, c];
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false;

        // Check if any enemy piece can capture the king
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && (piece === piece.toUpperCase()) !== isWhite) {
                    const moves = this.getRawMoves(r, c);
                    if (moves.some(m => m[0] === kingPos[0] && m[1] === kingPos[1])) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    getRawMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const type = piece.toUpperCase();
        const isWhite = piece === piece.toUpperCase();

        switch (type) {
            case 'P':
                return this.getPawnMoves(row, col, isWhite);
            case 'R':
                return this.getStraightMoves(row, col, isWhite);
            case 'N':
                return this.getKnightMoves(row, col, isWhite);
            case 'B':
                return this.getDiagonalMoves(row, col, isWhite);
            case 'Q':
                return [...this.getStraightMoves(row, col, isWhite), ...this.getDiagonalMoves(row, col, isWhite)];
            case 'K':
                return this.getKingMoves(row, col, isWhite);
            default:
                return [];
        }
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        this.moveHistory.push(moveNotation);
        
        if (captured) {
            document.getElementById('moveLog').textContent = `Captured ${this.getPieceSymbol(captured)} at ${moveNotation}`;
        } else {
            document.getElementById('moveLog').textContent = `Last move: ${moveNotation}`;
        }
    }

    updateStatus() {
        const turnDiv = document.getElementById('turn');
        const statusDiv = document.getElementById('status');
        
        turnDiv.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        
        // Check for check or checkmate
        if (this.isKingInCheck(this.currentPlayer === 'white')) {
            statusDiv.textContent = 'Check!';
            // TODO: Implement checkmate detection
        } else {
            statusDiv.textContent = 'Game in progress';
        }
    }
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
