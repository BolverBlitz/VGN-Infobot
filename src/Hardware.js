const si = require('systeminformation');

let Hardware = new Promise(function(resolve, reject) {
	var Output = "";
			si.cpu()
			.then(cpu => {
				//console.log('- CPU: ' + cpu.brand + ' ' + cpu.cores + 'x' + cpu.speed + ' Ghz');
				si.currentLoad()
					.then(load => {
						//console.log('- Load: ' + load.currentload);
						si.mem()
							.then(mem => {
								/*
								Output = Output + '- CPU: ' + cpu.brand + ' ' + cpu.cores + 'x' + cpu.speed + ' Ghz';
								Output = Output + '\n- Load: ' + load.currentload;
								Output = Output + '\n- Memory Total: ' + Round2Dec(mem.total/1073741824) + ' GB'
								Output = Output + '\n- Memory Free: ' + Round2Dec(mem.free/1073741824) + ' GB'
								*/
								var Hardware = {
									
									cpubrand: cpu.brand,
									cpucores: cpu.cores,
									cpuspeed: cpu.speed,
									load: load.currentload,
									memorytotal: mem.total,
									memoryfree: mem.free,
								};
								//console.log(Hardware);
								resolve(Hardware);
							})
							.catch(error => console.error(error));
					})
					.catch(error => console.error(error));
			})
			.catch(error => console.error(error));
});

function Round2Dec(num){
	return Math.round(num * 100) / 100
}

exports.Hardware = Hardware;