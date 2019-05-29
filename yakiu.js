'use strict';
$(document).ready(function(){
	const wait = (msec) => {
		return new Promise((resolve, reject) => {
			setTimeout(resolve, msec);
		});
	};
	async function next(v){
		await wait(v.pace);
		nextBatter(v);
	};
	class Versus {
		constructor() {
			this.inning = 1;
			this.outs = 0;
			this.runsByInning = [0,0,0,0,0,0,0,0,0];
			this.runsTotal = 0;
			this.runners = [0,0,0];
			this.batter = 1;
			this.randTable = [
				0.1636363636,
				0.1636363636,
				0.2363636364,
				0.4727272727,
				0.4727272727,
				0.6727272727,
				0.7818181818,
				1,
			];
			this.resultTable = [
				"ホームラン", // 0
				"スリーベース", // 1
				"ツーベース", // 2
				"ヒット", // 3
				"死球",   // 4
				"四球",   // 5
				"三振",   // 6
				"凡退",   // 7
			];
			this.results = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
			this.inningHasRunner = 0;
			this.message;
			this.allReset();
		}
		allReset() {
			for (let i = 1; i < 10; i++) {
				$('#inning-' + i).find('ol').empty();
				$('#inning-' + i).hide();
				$('#score-' + i).empty();
			}
			$('#score-total').empty();
			$('#summary td').empty();
		
		}
		resetMessage() {
			this.message = new Array();
		}
		setMessage(str) {
			
			this.message.push(str);
		}
		getMessage() {
			return this.message.join(' ');
		}
		getOutCount() {
			switch(this.outs) {
				case 0:
					return '無死';
				case 1:
					return '一死';
				case 2:
					return '二死';
			}
		}
		getRunners () {
			if (this.runners[0] && this.runners[1] && this.runners[2]) {
				return '満塁';
			} else if (this.runners[0] || this.runners[1] || this.runners[2]) {
				let r = new Array();
				if (this.runners[0]) r.push('一');
				if (this.runners[1]) r.push('二');
				if (this.runners[2]) r.push('三');
				return r.join('、') + '塁';
			} else {
				return '走者なし';
			}
		}
		afterResult(result) {
			if (result.index > 5) {
				this.outs++;
			}
			if (this.outs >= 3) {
				if (0 == this.inningHasRunner) {
					this.setMessage('<span class="one-two-three">三者凡退</span>');
				}
				this.setMessage((this.inning == 9) ? '試合終了' : 'チェンジ');
			}
			if (9 == this.batter) {
				this.batter = 1;
			} else {
				this.batter++;
			}
			this.displayMessage();
			if (this.outs >= 3) {
				this.runners[0] = this.runners[1] = this.runners[2] = 0;
				this.outs = 0;
				this.inning++;
				this.inningHasRunner = 0;
			}
		}
		displayMessage(){
			let lid = '#inning-' + this.inning;
			$(lid).find('ol').append($('<li>').html(this.getMessage()));
			$(lid).show();
			$(window).scrollTop($('#target').offset().top);
		}
		isGameSet () {
			return (this.inning > 9);
		}
		pickResult() {
			this.resetMessage('');
			this.setMessage('[' + this.batter + '番 松田]');
			this.setMessage(this.getOutCount());
			this.setMessage(this.getRunners());
			let rand = Math.random();
			let idx;
			let result;
			for (let i = 0; i < this.randTable.length; i++) {
				if (this.randTable[i] >= rand) {
					idx = i;
					break;
				}
			}
			result = {'index': idx, 'result' : this.resultTable[idx]};
			switch (idx) {
				case 0:
					this.results[this.batter - 1][0]++;
					this.results[this.batter - 1][1]++;
					this.results[this.batter - 1][2]++;
					this.inningHasRunner = 1;
					break;
				case 1:
				case 2:
				case 3:
					this.results[this.batter - 1][0]++;
					this.results[this.batter - 1][1]++;
					this.inningHasRunner = 1;
					break;
				case 4:
				case 5:
					this.inningHasRunner = 1;
					break;
				case 6:
					this.results[this.batter - 1][3]++;
				case 7:
					this.results[this.batter - 1][0]++;
					break;
			}
			return result;
		}
		calcResult(res) {
			let runs = 0;
			let cond = '';
			switch(res.index) {
				case 0: // ホームラン
					runs = this.runners[0] + this.runners[1] + this.runners[2] + 1;
					this.runners[0] = this.runners[1] = this.runners[2] = 0;
					this.runsByInning[this.inning - 1] += runs;
					this.runsTotal += runs;
					switch(runs) {
						case 1:
							cond = 'ソロ';
							break;
						case 2:
						case 3:
							cond = runs + 'ラン';
							break;
						case 4:
							cond = '満塁';
						default:
							break;
					}
					break;
				case 1: // 3B
					runs = this.runners[0] + this.runners[1] + this.runners[2];
					this.runners[0] = this.runners[1] = 0;
					this.runners[2] = 1;
					this.runsByInning[this.inning - 1] += runs;
					this.runsTotal += runs;
					switch(runs) {
						case 1:
							break;
						case 2:
						case 3:
							cond = '走者一掃';
						default:
							break;
					}
					
					break;
				case 2: // 2B
					runs = this.runners[1] + this.runners[2];
					let runnerCount = this.runners[0] + this.runners[1] + this.runners[2];
					if (2 == this.outs && this.runners[0]) {
						this.runners[2] = 0;
						runs++;
					} else if (this.runners[0]){
						this.runners[2] = 1;
					}
					this.runners[0] = 0;
					this.runners[1] = 1;
					this.runsByInning[this.inning - 1] += runs;
					this.runsTotal += runs;
					if (runs > 1 && runs == runnerCount) {
						cond = '走者一掃';
					}
					break;
				case 3: // 1B
					if (this.runners[2]) {
						runs++;
					}
					if (this.runners[1]) {
						this.runners[2] = 1;
						this.runners[1] = 0;
						if (2 == this.outs) {
							this.runners[2] = 0;
							runs++;
						}
					}
					if (this.runners[0]) {
						this.runners[1] = 1;
					}
					this.runners[0] = 1;
					this.runsByInning[this.inning - 1] += runs;
					this.runsTotal += runs;
					if (runs > 0) {
						cond = 'タイムリー';
					}
					break;
				case 4: // B
				case 5: // DB
					if (this.runners[0] && this.runners[1] && this.runners[2]) {
						cond = '押し出し';
						runs = 1;
						this.runsByInning[this.inning - 1] += runs;
						this.runsTotal += runs;
					} else if (! this.runners[0]){
						this.runners[0] = 1;
					} else if (2 == (this.runners[0] + this.runners[1] + this.runners[2])) {
						this.runners[0] = this.runners[1] = this.runners[2] = 1;
					} else {
						this.runners[1] = 1;
					}
					break;
				case 6:
				case 7:
					if (this.outs == 2 && (this.runners[1] + this.runners[2])) {
						cond = '決定機を逃す';
					}
				default:
					break;
			}
			this.setMessage('<span class="result-' + res.index + '">' + cond + res.result + '</span>');
			if (runs) {
				this.setMessage(runs + '点追加！');
				if (this.runsByInning[this.inning - 1] >= 10) {
					this.setMessage('この回<strong>' + this.runsByInning[this.inning - 1] + '</strong>点目！');
				} else {
					this.setMessage('この回' + this.runsByInning[this.inning - 1] + '点目！');
				}
				
			}
			
		}
		setScoreBoard() {
			$('#score-'+ (this.inning)).text(this.runsByInning[this.inning - 1]);
			$('#score-total').text(this.runsTotal);
		}
		drawSummary () {
			$('#summary').show();
			let d = 0, h = 0, r = 0, k = 0;
			for(let i = 0; i < 9; i++) {
				d += this.results[i][0];
				h += this.results[i][1];
				r += this.results[i][2];
				k += this.results[i][3];
				$('#summary').find('td').append($('<p>').text((i+1)+'番松田 : '+this.results[i][0]+'打数 '+this.results[i][1]+'安打 '+this.results[i][2]+'本塁打 '+this.results[i][3]+'三振'));
			}
			$('#summary').find('td').append($('<hr>'));
			$('#summary').find('td').append($('<p>').text('全松田 : '+d+'打数 '+h+'安打 '+r+'本塁打 '+k+'三振'));
			$('#summary').find('td').append($('<p>').text('打率 : '+ ((h / d).toString().substr(1) + '00').substr(0, 4)));
			$('body').css('padding-top','290px');
		}
		setPace(val) {
			this.pace = val;
		}
	}
	function nextBatter(v) {
		let result = v.pickResult();
		v.calcResult(result);
		v.setScoreBoard();
		v.afterResult(result);
		if (v.isGameSet()) {
			$('#restart').show();
			$(window).scrollTop($('#target').offset().top);
			v.drawSummary();
		} else {
			next(v);
		}
	}
	let v = new Versus();
	$('#start, #start_').on('click', function(){
		v.setPace($('#pace').val());
		$('#start, #past').hide();
		$('#description').hide();
		nextBatter(v);
	});
	$('#restart').on('click', function(){
		v = new Versus();
		v.setPace($('#pace').val());
		$(this).hide();
		nextBatter(v);
	});
	$('#summary').on('click', function() {
		$(this).find('p, hr').toggle();
		$(this).height('10px');
		$(this).find('td').css({'height':'10px','overflow':'hidden'});
	});
	$('#pace').on('change', function() {
		v.setPace($('#pace').val());
	});
});
