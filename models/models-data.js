// models/models-data.js — OTOMATİK ÜRETİLDİ, elle düzenlemeyin.
// Kaynak: models/model_*.json · Üretmek için: node tools/build-models-data.js
// Hazır model galerisi (models-gallery.js) verileri buradan okur; böylece sayfa
// file:// ile açıldığında da modeller yüklenebilir.
window.VETIN_MODELS = {
  "model_1": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Konsol kiriş – tekil yük",
        "en": "Cantilever – point load"
      },
      "objective": {
        "tr": "Ankastre mesnette moment tepkisi oluşur; yükün ötesinde V = M = 0.",
        "en": "A moment reaction develops at the fixed end; beyond the load V = M = 0."
      },
      "level": "basic",
      "order": 3
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 1,
        "magnitude": 6,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 6,
          "Mz": 6
        }
      ],
      "Mmax": 0,
      "Mmin": -6,
      "Vmax": 6,
      "Vmin": 0
    }
  },
  "model_2": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – tekil yük",
        "en": "Simple beam – point load"
      },
      "objective": {
        "tr": "Tepkileri ΣM ile bulun; tekil yük altında V sıçrar, M kırılır.",
        "en": "Find the reactions with ΣM; under a point load V jumps and M has a kink."
      },
      "level": "basic",
      "order": 1
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 1,
        "magnitude": 6,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 4
        },
        {
          "x": 3,
          "Fy": 2
        }
      ],
      "Mmax": 4,
      "Mmin": 0,
      "Vmax": 4,
      "Vmin": -2
    }
  },
  "model_3": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – düzgün yayılı yük",
        "en": "Simple beam – uniform load"
      },
      "objective": {
        "tr": "V doğrusal, M paraboliktir; M_max, V = 0 olan açıklık ortasındadır.",
        "en": "V is linear and M parabolic; M_max occurs at midspan where V = 0."
      },
      "level": "basic",
      "order": 2
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 3,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 6
        },
        {
          "x": 3,
          "Fy": 6
        }
      ],
      "Mmax": 4.5,
      "Mmin": 0,
      "Vmax": 6,
      "Vmin": -6
    }
  },
  "model_4": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – üçgen yük",
        "en": "Simple beam – triangular load"
      },
      "objective": {
        "tr": "V ikinci, M üçüncü derecedir; M_max, V = 0 olan x = L/√3 noktasındadır.",
        "en": "V is quadratic and M cubic; M_max occurs where V = 0, at x = L/√3."
      },
      "level": "intermediate",
      "order": 5
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": 0,
        "endMagnitude": -2
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 3,
          "Fy": 2
        }
      ],
      "Mmax": 1.154701,
      "Mmin": 0,
      "Vmax": 1,
      "Vmin": -2
    }
  },
  "model_5": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – tekil moment",
        "en": "Simple beam – concentrated moment"
      },
      "objective": {
        "tr": "Kuvvet çifti V'yi değiştirmez ama M'de sıçrama yapar.",
        "en": "A couple does not change V but causes a jump in M."
      },
      "level": "basic",
      "order": 4
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 1,
        "magnitude": 3
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": -1
        },
        {
          "x": 3,
          "Fy": 1
        }
      ],
      "Mmax": 2,
      "Mmin": -1,
      "Vmax": 0,
      "Vmin": -1
    }
  },
  "model_6": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Basit kiriş – trapez yük",
        "en": "Simple beam – trapezoidal load"
      },
      "objective": {
        "tr": "Trapez yükü dikdörtgen + üçgen olarak ayırıp bileşkeleri bulun.",
        "en": "Split the trapezoid into a rectangle and a triangle to find the resultants."
      },
      "level": "intermediate",
      "order": 6
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": -3,
        "endMagnitude": -1
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 3.5
        },
        {
          "x": 3,
          "Fy": 2.5
        }
      ],
      "Mmax": 2.265414,
      "Mmin": 0,
      "Vmax": 3.5,
      "Vmin": -2.5
    }
  },
  "model_7": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – ankastre ve kayıcı",
        "en": "Gerber beam – fixed and roller"
      },
      "objective": {
        "tr": "Mafsalda M = 0 denklemini kullanın; asılı parçayı önce çözün.",
        "en": "Use M = 0 at the hinge; solve the suspended part first."
      },
      "level": "advanced",
      "order": 10
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "roller-support",
        "x": 0
      },
      {
        "type": "fixed-support",
        "x": 5
      }
    ],
    "hinges": [
      {
        "x": 3
      }
    ],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 2,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 3,
        "endX": 5,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 2,
        "magnitude": -1
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 5,
          "Fy": 9,
          "Mz": -10
        }
      ],
      "Mmax": 2,
      "Mmin": -10,
      "Vmax": 1,
      "Vmin": -9
    }
  },
  "model_8": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – üç mesnet",
        "en": "Gerber beam – three supports"
      },
      "objective": {
        "tr": "Mafsal kuvveti asılı parçadan taşıyıcı parçaya aktarılır.",
        "en": "The hinge force is transferred from the suspended part to the supporting part."
      },
      "level": "advanced",
      "order": 11
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      },
      {
        "type": "roller-support",
        "x": 3
      }
    ],
    "hinges": [
      {
        "x": 4
      }
    ],
    "concentratedLoads": [
      {
        "x": 4.5,
        "magnitude": 5,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 2,
        "endX": 3,
        "magnitude": -4
      }
    ],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 2,
        "startMagnitude": -12,
        "endMagnitude": -4
      }
    ],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 11.388889
        },
        {
          "x": 3,
          "Fy": 11.111111
        },
        {
          "x": 5,
          "Fy": 2.5
        }
      ],
      "Mmax": 6.179856,
      "Mmin": -2.5,
      "Vmax": 11.388889,
      "Vmin": -8.611111
    }
  },
  "model_9": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Gerber kirişi – yatay yük ve moment",
        "en": "Gerber beam – horizontal load and moment"
      },
      "objective": {
        "tr": "Yatay yük yalnızca sabit mesnede kadar N oluşturur; mesnet üzerindeki moment M'de sıçrama yapar.",
        "en": "The horizontal load creates N only up to the pinned support; the moment at the support causes a jump in M."
      },
      "level": "advanced",
      "order": 12
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 6
    },
    "supports": [
      {
        "type": "roller-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 3
      },
      {
        "type": "pin-support",
        "x": 6
      }
    ],
    "hinges": [
      {
        "x": 4
      }
    ],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 20,
        "angle": 3.141592653589793
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [
      {
        "startX": 0,
        "endX": 3,
        "startMagnitude": 0,
        "endMagnitude": -12
      }
    ],
    "concentratedMoments": [
      {
        "x": 6,
        "magnitude": -10
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 2,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 4.333333
        },
        {
          "x": 3,
          "Fy": 18.666667
        },
        {
          "x": 6,
          "Fy": -5,
          "Fx": 20
        }
      ],
      "Mmax": 10,
      "Mmin": -5,
      "Vmax": 5,
      "Vmin": -13.666667
    }
  },
  "model_10": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "İki ankastreli, iki mafsallı kiriş",
        "en": "Two fixed ends, two hinges"
      },
      "objective": {
        "tr": "Ortadaki parça iki mafsala oturur; her mafsalda M = 0.",
        "en": "The middle part rests on two hinges; M = 0 at each hinge."
      },
      "level": "advanced",
      "order": 13
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 4
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      },
      {
        "type": "fixed-support",
        "x": 4
      }
    ],
    "hinges": [
      {
        "x": 1
      },
      {
        "x": 3
      }
    ],
    "concentratedLoads": [
      {
        "x": 1.5,
        "magnitude": 2,
        "angle": 1.5707963267948966
      },
      {
        "x": 2.5,
        "magnitude": 2,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [
      {
        "x": 2,
        "magnitude": 4
      }
    ],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 0,
          "Mz": 0
        },
        {
          "x": 4,
          "Fy": 4,
          "Mz": -4
        }
      ],
      "Mmax": 3,
      "Mmin": -4,
      "Vmax": 0,
      "Vmin": -4
    }
  },
  "model_11": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Çıkmalı (konsollu) kiriş",
        "en": "Overhanging beam"
      },
      "objective": {
        "tr": "Çıkma bölgesinde negatif moment oluşur; M'nin sıfır olduğu noktayı bulun.",
        "en": "Negative moment develops over the overhang; locate the point where M = 0."
      },
      "level": "intermediate",
      "order": 7
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 6
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 4
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 6,
        "magnitude": 4,
        "angle": 1.5707963267948966
      }
    ],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 6,
        "magnitude": -2
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 1
        },
        {
          "x": 4,
          "Fy": 15
        }
      ],
      "Mmax": 0.25,
      "Mmin": -12,
      "Vmax": 8,
      "Vmin": -7
    }
  },
  "model_12": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Eğik tekil yük",
        "en": "Inclined point load"
      },
      "objective": {
        "tr": "Yükü bileşenlerine ayırın: düşey bileşen V ve M'yi, yatay bileşen N'yi oluşturur.",
        "en": "Resolve the load into components: the vertical part creates V and M, the horizontal part creates N."
      },
      "level": "intermediate",
      "order": 8
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "pin-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      }
    ],
    "hinges": [],
    "concentratedLoads": [
      {
        "x": 2,
        "magnitude": 10,
        "angle": 1.0471975511965976
      }
    ],
    "distributedLoads": [],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 5.196152,
          "Fx": -5
        },
        {
          "x": 5,
          "Fy": 3.464102
        }
      ],
      "Mmax": 10.392305,
      "Mmin": 0,
      "Vmax": 5.196152,
      "Vmin": -3.464102
    }
  },
  "model_13": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Konsol – yayılı yük ve burulma",
        "en": "Cantilever – distributed load and torque"
      },
      "objective": {
        "tr": "Ankastre mesnette düşey kuvvet, eğilme ve burulma tepkileri birlikte oluşur.",
        "en": "The fixed support develops vertical, bending and torsional reactions together."
      },
      "level": "intermediate",
      "order": 9
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 3
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 3,
        "magnitude": -3
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [
      {
        "x": 3,
        "magnitude": 4
      }
    ],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "reactions": [
        {
          "x": 0,
          "Fy": 9,
          "Mz": 13.5
        }
      ],
      "Mmax": 0,
      "Mmin": -13.5,
      "Vmax": 9,
      "Vmin": 0
    }
  },
  "model_14": {
    "format": "vetin-beam",
    "version": 2,
    "meta": {
      "title": {
        "tr": "Neden çözülmüyor? – hiperstatik kiriş",
        "en": "Why can't it be solved? – indeterminate beam"
      },
      "objective": {
        "tr": "Bilinmeyen sayısı (4) denge denklemlerinden (3) fazla: sistem 1. derece hiperstatiktir.",
        "en": "There are more unknowns (4) than equilibrium equations (3): the beam is indeterminate to degree 1."
      },
      "level": "advanced",
      "order": 14,
      "expectSolvable": false
    },
    "units": {
      "length": "m",
      "force": "kN",
      "moment": "kNm",
      "distributedLoad": "kN/m",
      "angle": "rad"
    },
    "beam": {
      "length": 5
    },
    "supports": [
      {
        "type": "fixed-support",
        "x": 0
      },
      {
        "type": "roller-support",
        "x": 5
      }
    ],
    "hinges": [],
    "concentratedLoads": [],
    "distributedLoads": [
      {
        "startX": 0,
        "endX": 5,
        "magnitude": -2
      }
    ],
    "trapezoidalLoads": [],
    "concentratedMoments": [],
    "torsionMoments": [],
    "gridSettings": {
      "metersPerGrid": 0.1,
      "kNPerGrid": 1,
      "gridSize": 20
    },
    "expected": {
      "status": "hyperstatic",
      "degree": 1
    }
  }
};
