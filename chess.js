class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.aiPlayer = 'white'; // AI plays as white
        this.aiElo = parseInt(document.getElementById('aiElo').value) || 600;
        this.boardHistory = [];
        this.playerHistory = [];
        this.kingMoved = { white: false, black: false };
        this.rookMoved = { white: [false, false], black: [false, false] }; // [kingside, queenside]
        this.encouragingMessages = [
            "Great move! Keep it up!",
            "You're playing brilliantly!",
            "Nice strategy!",
            "Excellent positioning!",
            "You're doing fantastic!",
            "Keep pushing forward!",
            "Outstanding play!",
            "You're on fire!",
            "Brilliant thinking!",
            "Superb move!"
        ];
        this.isAiThinking = false;
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
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('undoAllBtn').addEventListener('click', () => this.undoAll());
        if (this.aiPlayer === 'white') {
            setTimeout(() => this.aiMove(), 500); // Delay for AI first move
        }
    }

    reset() {
        this.board = this.initializeBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.aiElo = parseInt(document.getElementById('aiElo').value) || 600;
        this.boardHistory = [];
        this.playerHistory = [];
        this.kingMoved = { white: false, black: false };
        this.rookMoved = { white: [false, false], black: [false, false] };
        this.isAiThinking = false;
        this.renderBoard();
        this.updateStatus();
        if (this.aiPlayer === 'white') {
            setTimeout(() => this.aiMove(), 500);
        }
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
                    const isWhitePiece = piece === piece.toUpperCase();
                    square.classList.add(isWhitePiece ? 'white-piece' : 'black-piece');
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
        if (this.gameOver || this.isAiThinking) return;

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
            if (this.currentPlayer === this.aiPlayer) {
                setTimeout(() => this.aiMove(), 500);
            }
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
        const direction = isWhite ? 1 : -1;
        const startRow = isWhite ? 1 : 6;

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
        
        // Castling
        if (!this.kingMoved[isWhite ? 'white' : 'black'] && !this.isKingInCheck(isWhite)) {
            const player = isWhite ? 'white' : 'black';
            const kingRow = isWhite ? 0 : 7;
            
            // Kingside castling
            if (!this.rookMoved[player][0] && 
                this.board[kingRow][5] === null && this.board[kingRow][6] === null &&
                !this.isSquareUnderAttack(kingRow, 5, !isWhite) && 
                !this.isSquareUnderAttack(kingRow, 6, !isWhite)) {
                moves.push([kingRow, 6]);
            }
            
            // Queenside castling
            if (!this.rookMoved[player][1] && 
                this.board[kingRow][1] === null && this.board[kingRow][2] === null && this.board[kingRow][3] === null &&
                !this.isSquareUnderAttack(kingRow, 2, !isWhite) && 
                !this.isSquareUnderAttack(kingRow, 3, !isWhite)) {
                moves.push([kingRow, 2]);
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

    isSquareUnderAttack(row, col, byWhite) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && (piece === piece.toUpperCase()) === byWhite) {
                    const moves = this.getRawMoves(r, c);
                    if (moves.some(m => m[0] === row && m[1] === col)) {
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
        // Save state for undo
        this.boardHistory.push(this.board.map(row => [...row]));
        this.playerHistory.push(this.currentPlayer);
        
        const piece = this.board[fromRow][fromCol];
        const captured = this.board[toRow][toCol];
        
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for pawn promotion
        if ((piece === 'P' && toRow === 7) || (piece === 'p' && toRow === 0)) {
            this.promotePawn(toRow, toCol, piece === 'P');
        }
        
        // Track king and rook movements for castling
        const isWhite = piece === piece.toUpperCase();
        if (piece.toUpperCase() === 'K') {
            this.kingMoved[isWhite ? 'white' : 'black'] = true;
        } else if (piece.toUpperCase() === 'R') {
            if (isWhite) {
                if (fromCol === 0) this.rookMoved.white[1] = true; // queenside
                if (fromCol === 7) this.rookMoved.white[0] = true; // kingside
            } else {
                if (fromCol === 0) this.rookMoved.black[1] = true; // queenside
                if (fromCol === 7) this.rookMoved.black[0] = true; // kingside
            }
        }
        
        // Handle castling
        if (piece.toUpperCase() === 'K' && Math.abs(fromCol - toCol) === 2) {
            // Castling move
            const isKingside = toCol > fromCol;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            this.board[toRow][rookToCol] = this.board[toRow][rookFromCol];
            this.board[toRow][rookFromCol] = null;
            this.rookMoved[isWhite ? 'white' : 'black'][isKingside ? 0 : 1] = true;
        }
        
        if (captured) {
            document.getElementById('moveLog').textContent = `Captured ${this.getPieceSymbol(captured)} at ${moveNotation}`;
        } else {
            document.getElementById('moveLog').textContent = `Last move: ${moveNotation}`;
        }
    }

    aiMove() {
        this.isAiThinking = true;
        this.updateStatus(); // Show "AI is thinking..."
        
        const isWhite = this.currentPlayer === 'white';
        const depth = this.getDepthFromElo(this.aiElo);
        const moves = this.getAllLegalMoves(isWhite);
        
        if (moves.length === 0) {
            this.isAiThinking = false;
            return; // No moves, game over?
        }
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const move of moves) {
            const [fromRow, fromCol, toRow, toCol] = move;
            // Simulate move
            const piece = this.board[fromRow][fromCol];
            const captured = this.board[toRow][toCol];
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
            
            const score = this.minimax(depth - 1, !isWhite, -Infinity, Infinity);
            
            // Undo move
            this.board[fromRow][fromCol] = piece;
            this.board[toRow][toCol] = captured;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        if (bestMove) {
            this.movePiece(bestMove[0], bestMove[1], bestMove[2], bestMove[3]);
            this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            this.renderBoard();
            this.updateStatus();
            
            // Show encouraging message
            const message = this.encouragingMessages[Math.floor(Math.random() * this.encouragingMessages.length)];
            setTimeout(() => {
                alert(message);
                this.isAiThinking = false;
            }, 1000);
        } else {
            this.isAiThinking = false;
        }
    }

    updateStatus() {
        const turnDiv = document.getElementById('turn');
        const statusDiv = document.getElementById('status');
        
        turnDiv.textContent = this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1);
        if (this.isAiThinking) {
            statusDiv.textContent = 'AI is thinking...';
            statusDiv.style.color = '#ff6b6b';
        } else {
            statusDiv.textContent = 'Game in progress';
            statusDiv.style.color = '#764ba2';
        }
    }

    getDepthFromElo(elo) {
        if (elo < 800) return 1;
        if (elo < 1200) return 2;
        if (elo < 1600) return 3;
        if (elo < 2000) return 4;
        if (elo < 2400) return 5;
        return 6;
    }

    getAllLegalMoves(isWhite) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && (piece === piece.toUpperCase()) === isWhite) {
                    const pieceMoves = this.getValidMoves(r, c);
                    for (const [toR, toC] of pieceMoves) {
                        moves.push([r, c, toR, toC]);
                    }
                }
            }
        }
        return moves;
    }

    minimax(depth, isMaximizing, alpha, beta) {
        if (depth === 0) {
            return this.evaluateBoard();
        }
        
        const isWhite = isMaximizing;
        const moves = this.getAllLegalMoves(isWhite);
        
        if (moves.length === 0) {
            return isMaximizing ? -10000 : 10000; // Checkmate
        }
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const [fr, fc, tr, tc] = move;
                const piece = this.board[fr][fc];
                const captured = this.board[tr][tc];
                this.board[tr][tc] = piece;
                this.board[fr][fc] = null;
                
                // Handle promotion
                if ((piece === 'P' && tr === 7) || (piece === 'p' && tr === 0)) {
                    this.board[tr][tc] = piece === 'P' ? 'Q' : 'q';
                }
                
                const evaluation = this.minimax(depth - 1, false, alpha, beta);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                
                this.board[fr][fc] = piece;
                this.board[tr][tc] = captured;
                
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const [fr, fc, tr, tc] = move;
                const piece = this.board[fr][fc];
                const captured = this.board[tr][tc];
                this.board[tr][tc] = piece;
                this.board[fr][fc] = null;
                
                // Handle promotion
                if ((piece === 'P' && tr === 7) || (piece === 'p' && tr === 0)) {
                    this.board[tr][tc] = piece === 'P' ? 'Q' : 'q';
                }
                
                const evaluation = this.minimax(depth - 1, true, alpha, beta);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                
                this.board[fr][fc] = piece;
                this.board[tr][tc] = captured;
                
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluateBoard() {
        let score = 0;
        const pieceValues = {
            'P': 1, 'p': -1,
            'N': 3, 'n': -3,
            'B': 3, 'b': -3,
            'R': 5, 'r': -5,
            'Q': 9, 'q': -9,
            'K': 0, 'k': 0
        };
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    score += pieceValues[piece] || 0;
                }
            }
        }
        return score;
    }

    undo() {
        if (this.boardHistory.length > 0) {
            this.board = this.boardHistory.pop();
            this.currentPlayer = this.playerHistory.pop();
            this.selectedSquare = null;
            this.validMoves = [];
            this.moveHistory.pop(); // Remove last move from history
            this.renderBoard();
            this.updateStatus();
            document.getElementById('moveLog').textContent = 'Move undone';
        }
    }

    undoAll() {
        if (this.boardHistory.length > 0) {
            this.board = this.initializeBoard();
            this.currentPlayer = 'white';
            this.selectedSquare = null;
            this.validMoves = [];
            this.moveHistory = [];
            this.boardHistory = [];
            this.playerHistory = [];
            this.kingMoved = { white: false, black: false };
            this.rookMoved = { white: [false, false], black: [false, false] };
            this.isAiThinking = false;
            this.renderBoard();
            this.updateStatus();
            document.getElementById('moveLog').textContent = 'All moves undone';
            if (this.aiPlayer === 'white') {
                setTimeout(() => this.aiMove(), 500);
            }
        }
    }
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
