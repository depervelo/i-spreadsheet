import Canvas from './components/canvas';

interface ISpreadSheetOptions {
	rowCanvas?: (ctx: null, row: number, x: number, y: number, width: number, height: number) => void; // 행 캔버스
	colCanvas?: (ctx: null, col: number, x: number, y: number, width: number, height: number) => void; // 열 캔버스
	cellCanvas?: (ctx: null, row: number, col: number, x: number, y: number, width: number, height: number) => void; // 셀 캔버스
	rowText?: (row: number) => { text: string }; // 행 텍스트
	colText?: (col: number) => { text: string }; // 열 텍스트
	celText?: (row: number, col: number) => { text: string | null }; // 셀 텍스트
	rowHeight?: (row: number) => number; // 행 높이
	colWidth?: (col: number) => number; // 열 너비
	minHeight?: number; // 최소 행,열,셀 높이
	minWidth?: number; // 최소 행,열,셀 너비
	rowCnt?: number; // 행 갯수
	colCnt?: number; // 열 갯수
	scrollbarOffset?: number; // 스크롤바 오프셋
	resizerOffset?: number; // 리사이즈 오프셋
	freezeOffset?: number; // 행,열 고정 오프셋
	filterOffset?: number; // 필터 오프셋
	style?: {
		row?: {
			fill?: string;
			stroke?: string;
			selected?: string;
			textAlign?: 'start' | 'end' | 'left' | 'center' | 'right';
			bextBaseline?: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
			fontSize?: number;
			fontFamily?: string;
			lineWidth: number;
		};
		col?: {
			fill?: string;
			stroke?: string;
			selected?: string;
			textAlign?: 'start' | 'end' | 'left' | 'center' | 'right';
			bextBaseline?: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
			fontSize?: number;
			fontFamily?: string;
			lineWidth: number;
		};
		cell?: {
			fill?: string;
			stroke?: string;
			textAlign?: 'start' | 'end' | 'left' | 'center' | 'right';
			bextBaseline?: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom';
			fontSize?: number;
			fontFamily?: string;
			lineWidth?: number;
		};
	};
}

interface ISpreadSheetRange {
	row1: number;
	row2: number;
	row3: number;
	col1: number;
	col2: number;
	col3: number;
	sumWidth: number;
	sumHeight: number;
	scrollTop: number;
	scrollLeft: number;
	totalWidth: number;
	totalHeight: number;
}

interface ISpreadSheetFreeze {
	row: number; // 고정 행
	col: number; // 고정 열
	width: number;
	height: number;
}

interface ISpreadSheetCurrentBox {
	offset: {
		row: number;
		col: number;
	};
	row: number;
	col: number;
}

interface ISpreadSheetBox {
	row1: number;
	row2: number;
	col1: number;
	col2: number;
}

class ISpreadSheet {
	readonly el: Element;
	readonly canvas: Canvas;
	options: ISpreadSheetOptions;
	range: ISpreadSheetRange;
	freeze: ISpreadSheetFreeze;
	currentBox: ISpreadSheetCurrentBox;
	dragBox: ISpreadSheetBox;
	selectBox: ISpreadSheetBox[];
	constructor(selectors: Element | string, options: ISpreadSheetOptions | undefined) {
		let el = typeof selectors === 'string' ? document.querySelector(selectors) : selectors;
		if (!el) {
			throw 'The element does not exist.';
		}

		// 템플릿 생성
		const cssPrefix = 'i-spreadsheet';
		this.el = el;
		this.el.innerHTML = `
			<div class="${cssPrefix}">
				<canvas class="${cssPrefix}-canvas"></canvas>
				<div class="${cssPrefix}-overlayout">
					<div class="${cssPrefix}-freeze">
						<div class="${cssPrefix}-freeze-x"></div>
						<div class="${cssPrefix}-freeze-y"></div>
					</div>
					<div class="${cssPrefix}-select-group">
						<div class="${cssPrefix}-select-backdrop"></div>
						<div class="${cssPrefix}-select-border"></div>
					</div>
					<div class="${cssPrefix}-drag-group">
						<div class="${cssPrefix}-drag-backdrop"></div>
					</div>
					<div class="${cssPrefix}-current-group">
						<div class="${cssPrefix}-current-border"></div>
					</div>
					<div class="${cssPrefix}-editor"></div>
					<div class="${cssPrefix}-resize"></div>
					<div class="${cssPrefix}-filter"></div>
				</div>
				<div class="${cssPrefix}-scrollbar-bottom">
					<div class="${cssPrefix}-scrollbar ${cssPrefix}-scrollbar-x"></div>
				</div>
				<div class="${cssPrefix}-scrollbar-right">
					<div class="${cssPrefix}-scrollbar ${cssPrefix}-scrollbar-y"></div>
				</div>
				<div class="${cssPrefix}-scrollbar-empty"></div>
			</div>`;

		// 캔버스 생성
		this.canvas = new Canvas(`.${cssPrefix}-canvas`);

		// 옵션
		this.options = {
			rowText: row => {
				return {
					text: (row + 1).toString(),
				};
			},
			colText: col => {
				return {
					text: (col + 1).toString(),
				};
			},
			celText: () => {
				return {
					text: null,
				};
			},
			rowHeight: () => {
				return options?.minHeight || 30;
			},
			colWidth: () => {
				return options?.minWidth || 60;
			},
			minHeight: 30,
			minWidth: 60,
			rowCnt: 0,
			colCnt: 0,
			scrollbarOffset: 20,
			resizerOffset: 5,
			freezeOffset: 1,
			filterOffset: 20,
			style: {
				row: {
					fill: '#585757',
					stroke: '#c0c0c0',
					selected: '#e8eaed',
					textAlign: 'center',
					bextBaseline: 'middle',
					fontSize: 12,
					fontFamily: 'Arial',
					lineWidth: 0.5,
				},
				col: {
					fill: '#585757',
					stroke: '#c0c0c0',
					selected: '#e8eaed',
					textAlign: 'center',
					bextBaseline: 'middle',
					fontSize: 12,
					fontFamily: 'Arial',
					lineWidth: 0.5,
				},
				cell: {
					textAlign: 'left',
					bextBaseline: 'middle',
					fontSize: 12,
					fontFamily: 'Arial',
					fill: '#fff',
					stroke: '#e6e6e6',
					lineWidth: 0.5,
				},
			},
			...options,
		};
		this.range = {
			row1: -1,
			row2: -1,
			row3: -1,
			col1: -1,
			col2: -1,
			col3: -1,
			sumWidth: 0,
			sumHeight: 0,
			scrollTop: 0,
			scrollLeft: 0,
			totalWidth: 0,
			totalHeight: 0,
		};
		this.freeze = {
			row: -1,
			col: -1,
			width: 0,
			height: 0,
		};
		this.currentBox = {
			offset: {
				row: -1,
				col: -1,
			},
			row: -1,
			col: -1,
		};
		this.dragBox = {
			row1: -1,
			row2: -1,
			col1: -1,
			col2: -1,
		};
		this.selectBox = [];
	}

	/**
	 * 옵션 변경
	 */
	setOptions(options: ISpreadSheetOptions) {
		this.options = { ...this.options, ...options };
	}

	/**
	 * 캔버스 그리기
	 */
	load() {
		console.log('load');
	}
}

export default ISpreadSheet;
