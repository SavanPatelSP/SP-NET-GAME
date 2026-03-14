using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public Combatant combatant;
    private Camera mainCam;

    private void Awake()
    {
        combatant = GetComponent<Combatant>();
        combatant.controller = GetComponent<CharacterController>();
        mainCam = Camera.main;
    }

    private void Update()
    {
        if (!combatant.alive) return;

        combatant.cooldown = Mathf.Max(0f, combatant.cooldown - Time.deltaTime);

        Vector2 move = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        Vector2 joyMove = GameBootstrap.Instance.LeftJoystickValue;
        if (joyMove.sqrMagnitude > 0.01f) move += joyMove;

        Vector3 moveDir = new Vector3(move.x, 0f, move.y);
        if (moveDir.sqrMagnitude > 1f) moveDir.Normalize();

        combatant.controller.Move(moveDir * combatant.speed * combatant.speedMult * Time.deltaTime);

        Vector3 aimDir = GetAimDirection();
        if (aimDir.sqrMagnitude > 0.001f)
        {
            transform.forward = aimDir;
        }

        bool wantsFire = Input.GetMouseButton(0) || GameBootstrap.Instance.RightJoystickValue.magnitude > 0.2f;
        if (wantsFire)
        {
            GameBootstrap.Instance.Fire(combatant, aimDir);
        }

        if (Input.GetKeyDown(KeyCode.Alpha1)) GameBootstrap.Instance.SetPlayerWeapon(0);
        if (Input.GetKeyDown(KeyCode.Alpha2)) GameBootstrap.Instance.SetPlayerWeapon(1);
        if (Input.GetKeyDown(KeyCode.Alpha3)) GameBootstrap.Instance.SetPlayerWeapon(2);
    }

    private Vector3 GetAimDirection()
    {
        Vector2 right = GameBootstrap.Instance.RightJoystickValue;
        if (right.magnitude > 0.2f)
        {
            return new Vector3(right.x, 0f, right.y).normalized;
        }

        if (mainCam == null) mainCam = Camera.main;
        if (mainCam == null) return transform.forward;

        Ray ray = mainCam.ScreenPointToRay(Input.mousePosition);
        Plane plane = new Plane(Vector3.up, Vector3.zero);
        float enter;
        if (plane.Raycast(ray, out enter))
        {
            Vector3 hit = ray.GetPoint(enter);
            Vector3 dir = hit - transform.position;
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.001f) return dir.normalized;
        }
        return transform.forward;
    }
}
