var Op = {
	rotate_x: function(ang, vector){
		var matrix = [
			[1,0,0],
			[0,Math.cos(ang),-Math.sin(ang)],
			[0,Math.sin(ang),Math.cos(ang)]
		];
		return this.transform(matrix, vector);
	},
	rotate_y: function(ang, vector){
		var matrix = [
			[Math.cos(ang),0,Math.sin(ang)],
			[0,1,0],
			[-Math.sin(ang),0,Math.cos(ang)]
		];
		return this.transform(matrix, vector);
	},
	rotate_z: function(ang, vector){
		var matrix = [
			[Math.cos(ang),-Math.sin(ang),0],
			[Math.sin(ang),Math.cos(ang),0],
			[0,0,1]
		];
		return this.transform(matrix, vector);
	},
	scale: function(scalar, vector){
		var v = [];
		for ( var i = 0; i < vector.length; i++ ){
			v.push(scalar * vector[i]);
		}
		return v;
	},
	transform: function(matrix, vector){
		var v = [0, 0, 0];
		for ( var i = 0; i < matrix.length; i++ ){
			for ( var j = 0; j < vector.length; j++ ){
				// Linha da matriz x vetor
				v[i] += matrix[i][j] * vector[j];
			}
		}
		return v;
	},
	norm: function(vector){
		return Math.sqrt(this.innerProduct(vector, vector));
	},
	innerProduct: function(v1, v2){
		var p = 0;
		for ( var i = 0; i < v1.length; i++ ){
			p += v1[i] * v2[i];
		}
		return p;
	},
	sum: function(v1, v2){
		v = [];
		for ( var i = 0; i < v1.length; i++ ){
			v.push(v1[i] + v2[i]);
		}
		return v;
	},
	proj: function(v1, v2){
		if ( this.innerProduct(v1,v1) == 0 ) return [0,0,0];
		return this.scale(this.innerProduct(v2,v1)/this.innerProduct(v1,v1),v1);
	},
	transpose: function(matrix){
		var m = [[0, 0, 0],[0, 0, 0],[0, 0, 0]];
		for ( var i = 0; i < matrix.length; i++ ){
			for ( var j = 0; j < matrix[0].length; j++ ){
				m[j][i] = matrix[i][j];
			}
		}
		return m;
	}
}
