import unittest
from import_pdf import recover_faculty_and_credit, parse_time


class ImportRegressionTests(unittest.TestCase):
    def test_overflowed_surname_is_preserved(self):
        for initial in ('rMfSh', 'rABF'):
            row = {'rawLine': '345 BSCSE CSE 3712 Tue 08:30:AM - 11:00:AM - Mr. Abid Hasan Khondake' + initial + ' 1', 'Faculty Name': 'Mr. Abid Hasan Khondake', 'Faculty Initial': initial, 'Credit': '1'}
            name, recovered_initial, credit = recover_faculty_and_credit(row)
            self.assertEqual(name, 'Mr. Abid Hasan Khondaker')
            self.assertEqual(recovered_initial, initial[1:])
            self.assertEqual(credit, 1)

    def test_duplicate_faculty_text_is_not_an_initial(self):
        row = {'rawLine': '1 BSCSE CSE 1111 08:30:AM - 09:50:AM Ms. Example NameMs. Example Name 3', 'Faculty Name': 'Ms. Example Name', 'Faculty Initial': 'Ms. Example Name', 'Credit': '3'}
        self.assertEqual(recover_faculty_and_credit(row), ('Ms. Example Name', '', 3))

    def test_time_conversion_and_invalid_range(self):
        self.assertEqual(parse_time('11:11:AM - 01:40:PM'), ('11:11', '13:40'))
        with self.assertRaises(ValueError):
            parse_time('not a time')


if __name__ == '__main__':
    unittest.main()
