import unittest
import json
from datasets.generator import generate_random_graph
from datasets.importer import import_json, import_csv, import_txt
from datasets.presets import get_preset_graphs

class TestDatasetsAndImporters(unittest.TestCase):
    def test_random_graph_generator(self):
        g = generate_random_graph(num_vertices=20, edge_probability=0.25, min_weight=5, max_weight=50, seed=123)
        self.assertEqual(g.num_vertices, 20)
        self.assertGreater(g.num_edges(), 0)
        for w in g.weights:
            self.assertGreaterEqual(w, 5)
            self.assertLessEqual(w, 50)

    def test_json_importer(self):
        raw = json.dumps({
            "vertices": [
                {"id": 0, "weight": 10},
                {"id": 1, "weight": 20},
                {"id": 2, "weight": 30}
            ],
            "edges": [
                [0, 1],
                [1, 2]
            ]
        })
        res = import_json(raw)
        self.assertTrue(res.is_valid)
        self.assertEqual(res.graph.num_vertices, 3)
        self.assertEqual(res.graph.num_edges(), 2)

    def test_csv_importer(self):
        raw = """vertex_id,weight
0,15
1,25
2,35

source,target
0,1
1,2
"""
        res = import_csv(raw)
        self.assertTrue(res.is_valid)
        self.assertEqual(res.graph.num_vertices, 3)
        self.assertEqual(res.graph.num_edges(), 2)

    def test_txt_importer(self):
        raw = """# vertices
0 12
1 18
2 24

# edges
0 1
0 2
"""
        res = import_txt(raw)
        self.assertTrue(res.is_valid)
        self.assertEqual(res.graph.num_vertices, 3)
        self.assertEqual(res.graph.num_edges(), 2)

    def test_presets_loaded(self):
        presets = get_preset_graphs()
        self.assertIn('tiny', presets)
        self.assertIn('small', presets)
        self.assertIn('medium', presets)
        self.assertIn('dense', presets)
        self.assertIn('larger', presets)
        for name, g in presets.items():
            self.assertGreater(g.num_vertices, 0)
            self.assertGreater(g.num_edges(), 0)

if __name__ == '__main__':
    unittest.main()
